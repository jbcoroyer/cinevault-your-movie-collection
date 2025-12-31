/**
 * QuestsSection - Affiche les quêtes permanentes avec progression
 */

import { useState, useEffect, type ElementType } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getAllQuests, startQuest, QuestWithProgress } from "@/services/questService";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Target,
  Film,
  Clapperboard,
  Ghost,
  Disc,
  Calendar,
  Trophy,
  Sparkles,
  Play,
  CheckCircle2,
  ChevronRight,
  Tv,
  Users,
  Star,
} from "lucide-react";

const ICON_MAP: Record<string, ElementType> = {
  Target,
  Film,
  Clapperboard,
  Ghost,
  Disc,
  Calendar,
  Trophy,
  Sparkles,
  Play,
  Tv,
  Users,
  Star,
};

const RARITY_COLORS: Record<string, string> = {
  common: "#9ca3af",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

interface QuestsSectionProps {
  compact?: boolean;
  limit?: number;
  showAll?: boolean;
}

export function QuestsSection({ compact = false, limit, showAll = false }: QuestsSectionProps) {
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "discovery" | "collection" | "format">("all");

  useEffect(() => {
    if (user) {
      loadQuests();
    }
  }, [user]);

  const loadQuests = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getAllQuests(user.id);
    setQuests(data);
    setLoading(false);
  };

  const handleStart = async (questId: string) => {
    if (!user) return;
    setStarting(questId);
    
    const success = await startQuest(user.id, questId);
    
    if (success) {
      toast.success("Quête commencée !");
      loadQuests();
    } else {
      toast.error("Erreur lors du démarrage");
    }
    
    setStarting(null);
  };

  const filteredQuests = filter === "all" 
    ? quests 
    : quests.filter(q => q.category === filter);

  const displayQuests = limit ? filteredQuests.slice(0, limit) : filteredQuests;

  // Stats
  const completedCount = quests.filter(q => q.is_completed).length;
  const inProgressCount = quests.filter(q => q.is_started && !q.is_completed).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (compact) {
    // Version compacte pour le dashboard
    const recommendedQuests = quests
      .filter(q => !q.is_completed && q.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    return (
      <div className="space-y-3">
        {recommendedQuests.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-4">
            Commencez à collectionner pour débloquer des quêtes !
          </p>
        ) : (
          recommendedQuests.map((quest, index) => (
            <QuestCard key={quest.id} quest={quest} index={index} compact />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm text-white">{completedCount} complétées</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <Play className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-white">{inProgressCount} en cours</span>
        </div>
      </div>

      {/* Filter Tabs */}
      {showAll && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all", label: "Toutes" },
            { id: "discovery", label: "Découverte" },
            { id: "collection", label: "Collection" },
            { id: "format", label: "Formats" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filter === tab.id
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Quest Grid */}
      <div className="grid gap-3">
        {displayQuests.map((quest, index) => (
          <QuestCard 
            key={quest.id} 
            quest={quest} 
            index={index} 
            onStart={handleStart}
            starting={starting === quest.id}
          />
        ))}
      </div>

      {displayQuests.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">Aucune quête dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}

interface QuestCardProps {
  quest: QuestWithProgress;
  index: number;
  compact?: boolean;
  onStart?: (id: string) => void;
  starting?: boolean;
}

function QuestCard({ quest, index, compact = false, onStart, starting }: QuestCardProps) {
  const IconComponent = ICON_MAP[quest.icon_name] || Target;
  const rarityColor = RARITY_COLORS[quest.rarity] || RARITY_COLORS.common;
  const targetCount = quest.target_config?.count || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-4 rounded-xl border transition-all",
        quest.is_completed
          ? "bg-green-500/10 border-green-500/30"
          : quest.is_started
            ? "bg-white/5 border-white/20 hover:border-white/40"
            : "bg-white/5 border-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div 
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            quest.is_completed ? "bg-green-500/20" : "bg-white/10"
          )}
          style={{ color: quest.is_completed ? "#22c55e" : rarityColor }}
        >
          {quest.is_completed ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <IconComponent className="w-6 h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-semibold text-sm",
              quest.is_completed ? "text-green-400" : "text-white"
            )}>
              {quest.title}
            </h4>
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${rarityColor}20`,
                color: rarityColor 
              }}
            >
              {quest.rarity}
            </span>
          </div>

          <p className="text-xs text-white/50 mb-3 line-clamp-2">
            {quest.description}
          </p>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress 
                value={quest.progress} 
                className={cn(
                  "h-2",
                  quest.is_completed && "[&>div]:bg-green-500"
                )}
              />
            </div>
            <span className="text-xs text-white/50 whitespace-nowrap">
              {quest.current_progress}/{targetCount}
            </span>
          </div>

          {/* Actions */}
          {!quest.is_started && !quest.is_completed && onStart && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-7 text-xs border-white/20 hover:border-white/40"
              onClick={() => onStart(quest.id)}
              disabled={starting}
            >
              {starting ? "..." : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Commencer
                </>
              )}
            </Button>
          )}

          {quest.is_completed && quest.completed_at && (
            <p className="text-xs text-green-400/70 mt-2">
              ✓ Complétée le {new Date(quest.completed_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>

        {/* XP Reward */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-amber-500">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">+{quest.xp_reward}</span>
          </div>
          <span className="text-[10px] text-white/30 uppercase">XP</span>
        </div>
      </div>
    </motion.div>
  );
}
