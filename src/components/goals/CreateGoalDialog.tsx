import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateGoalInput, GoalType } from "@/hooks/useCollectionGoals";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Target,
  Film,
  Disc,
  User,
  Building2,
  Clock,
  CalendarIcon,
  Plus,
  Flame,
} from "lucide-react";

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (goal: CreateGoalInput) => Promise<void>;
  filterOptions?: {
    genres: string[];
    directors: string[];
    formats: string[];
    decades: string[];
  };
}

const GOAL_TYPES: { value: GoalType; label: string; icon: React.ElementType }[] = [
  { value: "count", label: "Nombre de films", icon: Target },
  { value: "genre", label: "Genre spécifique", icon: Film },
  { value: "format", label: "Format (DVD, Blu-ray...)", icon: Disc },
  { value: "director", label: "Réalisateur", icon: User },
  { value: "decade", label: "Décennie", icon: Clock },
  { value: "custom", label: "Objectif personnalisé", icon: Target },
];

const FORMAT_OPTIONS = [
  { value: "dvd", label: "DVD" },
  { value: "bluray", label: "Blu-ray" },
  { value: "uhd", label: "4K UHD" },
  { value: "steelbook", label: "Steelbook" },
  { value: "vhs", label: "VHS" },
];

const DECADE_OPTIONS = [
  "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"
];

export function CreateGoalDialog({ open, onOpenChange, onCreate, filterOptions }: CreateGoalDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [goalType, setGoalType] = useState<GoalType>("count");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetCount, setTargetCount] = useState(10);
  const [targetConfig, setTargetConfig] = useState<Record<string, any>>({});
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [deadline, setDeadline] = useState<Date | undefined>();

  const resetForm = () => {
    setStep(1);
    setGoalType("count");
    setTitle("");
    setDescription("");
    setTargetCount(10);
    setTargetConfig({});
    setPriority("medium");
    setDeadline(undefined);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleTypeSelect = (type: GoalType) => {
    setGoalType(type);
    
    // Auto-generate title based on type
    switch (type) {
      case "count":
        setTitle(`Atteindre ${targetCount} films`);
        break;
      case "genre":
        setTitle("Maître du [Genre]");
        break;
      case "format":
        setTitle("Collection [Format]");
        break;
      case "director":
        setTitle("Filmographie [Réalisateur]");
        break;
      case "decade":
        setTitle("Rétrospective [Décennie]");
        break;
      default:
        setTitle("");
    }
    
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!title || targetCount <= 0) return;

    setLoading(true);
    try {
      await onCreate({
        title,
        description: description || undefined,
        goal_type: goalType,
        target_config: targetConfig,
        target_count: targetCount,
        priority,
        deadline: deadline?.toISOString(),
      });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-display">
            {step === 1 ? "Nouvel objectif" : "Configurer l'objectif"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2"
            >
              <p className="text-sm text-white/50 mb-4">
                Quel type d'objectif souhaitez-vous créer ?
              </p>
              
              {GOAL_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeSelect(type.value)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white/70" />
                    </div>
                    <span className="text-white font-medium">{type.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Type-specific config */}
              {goalType === "genre" && (
                <div className="space-y-2">
                  <Label className="text-white/70">Genre</Label>
                  <Select
                    value={targetConfig.genre || ""}
                    onValueChange={(value) => {
                      setTargetConfig({ genre: value });
                      setTitle(`Maître du ${value}`);
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choisir un genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {(filterOptions?.genres || ["Action", "Comédie", "Drame", "Horreur", "Science-Fiction", "Thriller"]).map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {goalType === "format" && (
                <div className="space-y-2">
                  <Label className="text-white/70">Format</Label>
                  <Select
                    value={targetConfig.format || ""}
                    onValueChange={(value) => {
                      setTargetConfig({ format: value });
                      const label = FORMAT_OPTIONS.find(f => f.value === value)?.label || value;
                      setTitle(`Collection ${label}`);
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choisir un format" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {goalType === "decade" && (
                <div className="space-y-2">
                  <Label className="text-white/70">Décennie</Label>
                  <Select
                    value={targetConfig.decade || ""}
                    onValueChange={(value) => {
                      setTargetConfig({ decade: value });
                      setTitle(`Rétrospective années ${value}`);
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choisir une décennie" />
                    </SelectTrigger>
                    <SelectContent>
                      {DECADE_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>Années {d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {goalType === "director" && (
                <div className="space-y-2">
                  <Label className="text-white/70">Réalisateur</Label>
                  <Input
                    placeholder="Nom du réalisateur"
                    value={targetConfig.director_name || ""}
                    onChange={(e) => {
                      setTargetConfig({ director_name: e.target.value });
                      setTitle(`Filmographie ${e.target.value}`);
                    }}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-white/70">Titre de l'objectif</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Maître de l'horreur"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {/* Target count */}
              <div className="space-y-2">
                <Label className="text-white/70">Nombre cible</Label>
                <Input
                  type="number"
                  min={1}
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-white/70">Priorité</Label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                        priority === p
                          ? p === "high"
                            ? "bg-red-500/20 border-red-500/50 text-red-400"
                            : p === "medium"
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                              : "bg-blue-500/20 border-blue-500/50 text-blue-400"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {p === "high" && <Flame className="w-3 h-3 inline mr-1" />}
                      {p === "high" ? "Haute" : p === "medium" ? "Moyenne" : "Basse"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline (optional) */}
              <div className="space-y-2">
                <Label className="text-white/70">Date limite (optionnel)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/5 border-white/10",
                        !deadline && "text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP", { locale: fr }) : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description (optional) */}
              <div className="space-y-2">
                <Label className="text-white/70">Description (optionnel)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre objectif..."
                  className="bg-white/5 border-white/10 text-white resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-white/10"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!title || targetCount <= 0 || loading}
                  className="flex-1 bg-white text-black hover:bg-white/90"
                >
                  {loading ? "..." : "Créer"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
