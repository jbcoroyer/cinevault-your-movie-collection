import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Zap, Gift, CheckCircle2, Clock, 
  Plus, PenTool, Tv2, Disc, Ghost, Rocket, Clapperboard, Package
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getWeeklyChallenges, 
  claimChallengeReward, 
  WeeklyChallenge 
} from "@/services/gamificationService";
import { toast } from "sonner";

const ICON_MAP: Record<string, any> = {
  Plus, PenTool, Tv2, Disc, Ghost, Rocket, Clapperboard, Package,
  Trophy, Gift, Clock
};

export function WeeklyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  const loadChallenges = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getWeeklyChallenges(user.id);
    setChallenges(data);
    setLoading(false);
  };

  const handleClaim = async (challengeId: string) => {
    if (!user) return;
    setClaiming(challengeId);

    const result = await claimChallengeReward(user.id, challengeId);
    
    if (result.success) {
      toast.success(
        `Récompense réclamée ! +${result.xpEarned} XP, +${result.popcornEarned} 🍿`
      );
      loadChallenges();
    } else {
      toast.error("Erreur lors de la réclamation");
    }

    setClaiming(null);
  };

  // Calculer le temps restant jusqu'à la fin de la semaine
  const getTimeRemaining = () => {
    const now = new Date();
    const endOfWeek = new Date();
    const daysUntilSunday = 7 - now.getDay();
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const diff = endOfWeek.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}j ${hours}h`;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            Défis Hebdomadaires
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            {getTimeRemaining()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucun défi disponible cette semaine
          </p>
        ) : (
          challenges.map((challenge, index) => {
            const IconComponent = ICON_MAP[challenge.icon_name] || Trophy;
            const progress = challenge.progress;
            const progressPercent = Math.min(
              100, 
              (progress.current_progress / challenge.target_count) * 100
            );
            const isCompleted = progress.is_completed;
            const isClaimed = progress.reward_claimed;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  isClaimed 
                    ? "bg-muted/50 border-muted" 
                    : isCompleted 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isClaimed 
                      ? "bg-muted text-muted-foreground"
                      : isCompleted 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-primary/20 text-primary"
                  )}>
                    {isClaimed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn(
                        "font-semibold text-sm truncate",
                        isClaimed && "text-muted-foreground line-through"
                      )}>
                        {challenge.title}
                      </h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-primary font-medium">
                          +{challenge.xp_reward} XP
                        </span>
                        <span className="text-xs">
                          +{challenge.popcorn_reward} 🍿
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {challenge.description}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={progressPercent} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {progress.current_progress}/{challenge.target_count}
                      </span>
                    </div>

                    {isCompleted && !isClaimed && (
                      <Button
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => handleClaim(challenge.id)}
                        disabled={claiming === challenge.id}
                      >
                        {claiming === challenge.id ? (
                          "..."
                        ) : (
                          <>
                            <Gift className="w-3 h-3 mr-1" />
                            Réclamer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
