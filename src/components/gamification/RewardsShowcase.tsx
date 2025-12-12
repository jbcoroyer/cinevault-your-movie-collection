import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Award, Frame, Palette, Lock, CheckCircle2, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUserRewards, 
  getRewardDefinitions, 
  equipReward,
  UserReward 
} from "@/services/gamificationService";
import { toast } from "sonner";

interface RewardDefinition {
  id: string;
  reward_type: string;
  name: string;
  description: string;
  preview_data: any;
  unlock_criteria: any;
  rarity: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-400 bg-gray-400/10",
  rare: "border-blue-500 bg-blue-500/10",
  epic: "border-purple-500 bg-purple-500/10",
  legendary: "border-yellow-500 bg-yellow-500/10",
  grail: "border-orange-500 bg-orange-500/10",
};

export function RewardsShowcase() {
  const { user } = useAuth();
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [definitions, setDefinitions] = useState<RewardDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const [rewards, defs] = await Promise.all([
      user ? getUserRewards(user.id) : [],
      getRewardDefinitions()
    ]);
    setUserRewards(rewards);
    setDefinitions(defs);
    setLoading(false);
  };

  const handleEquip = async (rewardType: string, rewardId: string, currentlyEquipped: boolean) => {
    if (!user) return;
    setEquipping(rewardId);

    const success = await equipReward(user.id, rewardType, rewardId, !currentlyEquipped);
    
    if (success) {
      toast.success(currentlyEquipped ? "Récompense déséquipée" : "Récompense équipée !");
      loadData();
    } else {
      toast.error("Erreur lors de l'équipement");
    }

    setEquipping(null);
  };

  const unlockedIds = new Set(userRewards.map(r => r.reward_id));

  const renderRewardCard = (def: RewardDefinition) => {
    const isUnlocked = unlockedIds.has(def.id);
    const userReward = userRewards.find(r => r.reward_id === def.id);
    const isEquipped = userReward?.is_equipped || false;

    return (
      <motion.div
        key={def.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "relative p-4 rounded-xl border-2 transition-all",
          RARITY_COLORS[def.rarity] || RARITY_COLORS.common,
          !isUnlocked && "opacity-50 grayscale"
        )}
      >
        {isEquipped && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-primary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Équipé
            </Badge>
          </div>
        )}

        <div className="text-center">
          {/* Preview */}
          <div className="mb-3">
            {def.reward_type === 'title' && (
              <div 
                className="text-lg font-bold py-2"
                style={{ color: def.preview_data?.color || 'inherit' }}
              >
                {def.preview_data?.text || def.name}
              </div>
            )}
            {def.reward_type === 'frame' && (
              <div 
                className="w-16 h-16 mx-auto rounded-full"
                style={{ 
                  border: `${def.preview_data?.border_width || 3}px solid ${def.preview_data?.border_color || '#fff'}`,
                  boxShadow: def.preview_data?.glow ? `0 0 20px ${def.preview_data?.border_color}` : 'none'
                }}
              />
            )}
            {def.reward_type === 'theme' && (
              <div className="flex justify-center gap-1">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: def.preview_data?.primary }}
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: def.preview_data?.accent }}
                />
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: def.preview_data?.text }}
                />
              </div>
            )}
          </div>

          <h4 className="font-semibold text-sm">{def.name}</h4>
          <p className="text-xs text-muted-foreground mt-1">{def.description}</p>

          <Badge 
            variant="outline" 
            className={cn("mt-2 capitalize", RARITY_COLORS[def.rarity])}
          >
            {def.rarity}
          </Badge>

          {isUnlocked ? (
            <Button
              size="sm"
              variant={isEquipped ? "secondary" : "default"}
              className="w-full mt-3"
              onClick={() => handleEquip(def.reward_type, def.id, isEquipped)}
              disabled={equipping === def.id}
            >
              {equipping === def.id ? (
                "..."
              ) : isEquipped ? (
                "Déséquiper"
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Équiper
                </>
              )}
            </Button>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Verrouillé</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const titles = definitions.filter(d => d.reward_type === 'title');
  const frames = definitions.filter(d => d.reward_type === 'frame');
  const themes = definitions.filter(d => d.reward_type === 'theme');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="w-5 h-5 text-primary" />
          Récompenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="titles">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="titles" className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Titres</span>
            </TabsTrigger>
            <TabsTrigger value="frames" className="flex items-center gap-1">
              <Frame className="w-4 h-4" />
              <span className="hidden sm:inline">Cadres</span>
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-1">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Thèmes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="titles">
            <div className="grid grid-cols-2 gap-3">
              {titles.map(renderRewardCard)}
            </div>
          </TabsContent>

          <TabsContent value="frames">
            <div className="grid grid-cols-2 gap-3">
              {frames.map(renderRewardCard)}
            </div>
          </TabsContent>

          <TabsContent value="themes">
            <div className="grid grid-cols-2 gap-3">
              {themes.map(renderRewardCard)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
