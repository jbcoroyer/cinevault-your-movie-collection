/**
 * CineVault - Badges & Progression Page
 * Redesigned for clarity, engagement and mobile-first experience
 */

import { useEffect, useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, Badge } from "@/services/badgeService";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HoloBadge } from "@/components/gamification/HoloBadge";
import { cn } from "@/lib/utils";
import { type Rarity, RARITY_CONFIG } from "@/data/videoClubData";
import {
  Trophy,
  Film,
  Disc,
  Users,
  Star,
  Sparkles,
  Crown,
  Library,
  Heart,
  Eye,
  Zap,
  Award,
  Target,
  Flame,
  Shield,
  Gem,
  Tv,
  Clock,
  Gift,
  Lock,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  Map,
  Medal,
} from "lucide-react";

const ICON_MAP: Record<string, ElementType> = {
  Film, Disc, Users, Star, Sparkles, Crown, Library, Heart, Eye, Zap, Award,
  Target, Flame, Shield, Gem, Tv, Clock, Gift, Trophy, Map, Medal,
  Clapperboard: Film, Archive: Library, Brick: Library, Store: Library,
};

// XP level calculation
const calculateLevel = (xp: number) => {
  const level = Math.floor(xp / 1000) + 1;
  const currentLevelXp = xp % 1000;
  const xpForNextLevel = 1000;
  const progress = (currentLevelXp / xpForNextLevel) * 100;
  return { level, currentLevelXp, xpForNextLevel, progress };
};

// Level titles
const getLevelTitle = (level: number): string => {
  if (level >= 50) return "Légende";
  if (level >= 40) return "Maître";
  if (level >= 30) return "Expert";
  if (level >= 20) return "Pro";
  if (level >= 15) return "Passionné";
  if (level >= 10) return "Amateur";
  if (level >= 5) return "Novice";
  return "Débutant";
};

export default function Badges() {
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionCount, setCollectionCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"quests" | "badges">("quests");

  const totalXp = profile?.total_xp || 0;
  const { level, currentLevelXp, xpForNextLevel, progress } = calculateLevel(totalXp);
  const levelTitle = getLevelTitle(level);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [badgesData, physicalMovies] = await Promise.all([
          fetchAllBadges(user.id),
          getPhysicalMovies(user.id),
        ]);

        setBadges(badgesData);
        setCollectionCount(physicalMovies.length);
      } catch (error) {
        console.error("Error loading badges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const lockedBadges = badges.filter((b) => !b.isUnlocked);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-32 bg-white/5 animate-pulse rounded-2xl mb-6" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  // Guest view
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-8 max-w-4xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white/20" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">
            Débloquez des badges
          </h1>
          <p className="text-white/50 mb-8 max-w-sm mx-auto">
            Connectez-vous pour commencer votre aventure et collectionner des récompenses
          </p>
          <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90">
            Se connecter
          </Button>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5 md:p-6 mb-6"
          >
            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

            <div className="relative">
              {/* Level Badge */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <span className="text-2xl md:text-3xl font-display font-black text-white">
                      {level}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-amber-500 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                    {levelTitle}
                  </p>
                  <h2 className="text-xl md:text-2xl font-display font-bold text-white">
                    Niveau {level}
                  </h2>
                  <p className="text-white/40 text-sm">
                    {totalXp.toLocaleString()} XP total
                  </p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Prochain niveau</span>
                  <span className="text-amber-400 font-medium">
                    {currentLevelXp}/{xpForNextLevel} XP
                  </span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                  </motion.div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">{collectionCount}</span>
                  <span className="text-white/40 text-sm">films</span>
                </div>
                <div className="flex items-center gap-2">
                  <Medal className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">{unlockedBadges.length}</span>
                  <span className="text-white/40 text-sm">badges</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6"
          >
            <button
              onClick={() => setActiveTab("quests")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all",
                activeTab === "quests"
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Target className="w-5 h-5" />
              <span>Quêtes</span>
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all relative",
                activeTab === "badges"
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Trophy className="w-5 h-5" />
              <span>Badges</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === "badges" ? "bg-black/10" : "bg-white/10"
              )}>
                {unlockedBadges.length}/{badges.length}
              </span>
            </button>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "quests" && (
              <motion.div
                key="quests"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <QuestsTab />
              </motion.div>
            )}

            {activeTab === "badges" && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <BadgesTab badges={badges} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}

// ============ QUESTS TAB ============

import { getAllQuests, startQuest, QuestWithProgress } from "@/services/questService";
import {
  getWeeklyChallenges,
  claimChallengeReward,
  WeeklyChallenge,
} from "@/services/gamificationService";
import { toast } from "sonner";

function QuestsTab() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [questsData, challengesData] = await Promise.all([
        getAllQuests(user.id),
        getWeeklyChallenges(user.id),
      ]);
      setQuests(questsData);
      setChallenges(challengesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuest = async (questId: string) => {
    if (!user) return;
    setStarting(questId);
    const success = await startQuest(user.id, questId);
    if (success) {
      toast.success("Quête commencée !");
      loadData();
    } else {
      toast.error("Erreur");
    }
    setStarting(null);
  };

  const handleClaimChallenge = async (challengeId: string) => {
    if (!user) return;
    setClaiming(challengeId);
    const result = await claimChallengeReward(user.id, challengeId);
    if (result.success) {
      toast.success(`+${result.xpEarned} XP récupérés !`);
      loadData();
    } else {
      toast.error("Erreur");
    }
    setClaiming(null);
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const daysUntilSunday = 7 - now.getDay();
    const endOfWeek = new Date();
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    const diff = endOfWeek.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}j`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const activeQuests = quests.filter((q) => q.is_started && !q.is_completed);
  const completedQuests = quests.filter((q) => q.is_completed);
  const availableQuests = quests.filter((q) => !q.is_started && !q.is_completed);

  return (
    <div className="space-y-8">
      {/* Weekly Challenges Section */}
      {challenges.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className="font-display font-bold text-white">Défis de la semaine</h3>
            </div>
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {getTimeRemaining()} restants
            </span>
          </div>

          <div className="space-y-3">
            {challenges.map((challenge, i) => {
              const progressPercent = Math.min(
                100,
                (challenge.progress.current_progress / challenge.target_count) * 100
              );
              const isCompleted = challenge.progress.is_completed;
              const isClaimed = challenge.progress.reward_claimed;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    isClaimed
                      ? "bg-white/5 border-white/5 opacity-60"
                      : isCompleted
                      ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        isClaimed
                          ? "bg-white/5"
                          : isCompleted
                          ? "bg-green-500/20"
                          : "bg-orange-500/20"
                      )}
                    >
                      {isClaimed ? (
                        <CheckCircle2 className="w-5 h-5 text-white/30" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Target className="w-5 h-5 text-orange-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            "font-medium text-sm truncate",
                            isClaimed ? "text-white/40 line-through" : "text-white"
                          )}
                        >
                          {challenge.title}
                        </h4>
                        {!isClaimed && (
                          <span className="text-xs text-amber-400 font-medium whitespace-nowrap">
                            +{challenge.xp_reward} XP
                          </span>
                        )}
                      </div>

                      {!isClaimed && (
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={progressPercent} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-white/40 whitespace-nowrap">
                            {challenge.progress.current_progress}/{challenge.target_count}
                          </span>
                        </div>
                      )}
                    </div>

                    {isCompleted && !isClaimed && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimChallenge(challenge.id)}
                        disabled={claiming === challenge.id}
                        className="h-8 text-xs bg-green-500 hover:bg-green-600 text-white shrink-0"
                      >
                        {claiming === challenge.id ? "..." : "Réclamer"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Quests */}
      {activeQuests.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-display font-bold text-white">Quêtes en cours</h3>
            <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
              {activeQuests.length}
            </span>
          </div>

          <div className="space-y-3">
            {activeQuests.map((quest, i) => (
              <QuestCard key={quest.id} quest={quest} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Available Quests */}
      {availableQuests.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Map className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="font-display font-bold text-white">Quêtes disponibles</h3>
          </div>

          <div className="space-y-3">
            {availableQuests.slice(0, 5).map((quest, i) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                index={i}
                onStart={handleStartQuest}
                starting={starting === quest.id}
              />
            ))}
          </div>

          {availableQuests.length > 5 && (
            <p className="text-center text-white/40 text-sm mt-4">
              +{availableQuests.length - 5} autres quêtes disponibles
            </p>
          )}
        </section>
      )}

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <h3 className="font-display font-bold text-white">Quêtes terminées</h3>
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              {completedQuests.length}
            </span>
          </div>

          <div className="space-y-2">
            {completedQuests.slice(0, 3).map((quest, i) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm text-green-400 flex-1 truncate">{quest.title}</span>
                <span className="text-xs text-green-400/50">+{quest.xp_reward} XP</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9ca3af",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

interface QuestCardProps {
  quest: QuestWithProgress;
  index: number;
  onStart?: (id: string) => void;
  starting?: boolean;
}

function QuestCard({ quest, index, onStart, starting }: QuestCardProps) {
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
        quest.is_started
          ? "bg-white/5 border-white/20"
          : "bg-white/5 border-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${rarityColor}20` }}
        >
          <IconComponent className="w-5 h-5" style={{ color: rarityColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-white truncate">{quest.title}</h4>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${rarityColor}20`, color: rarityColor }}
            >
              {quest.rarity}
            </span>
          </div>

          <p className="text-xs text-white/40 mb-2 line-clamp-1">{quest.description}</p>

          <div className="flex items-center gap-2">
            <Progress value={quest.progress} className="h-1.5 flex-1" />
            <span className="text-[10px] text-white/40 whitespace-nowrap">
              {quest.current_progress}/{targetCount}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-sm font-bold">+{quest.xp_reward}</span>
          </div>
          {!quest.is_started && onStart && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs border-white/20 hover:bg-white hover:text-black"
              onClick={() => onStart(quest.id)}
              disabled={starting}
            >
              {starting ? "..." : "Commencer"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============ BADGES TAB ============

function BadgesTab({ badges }: { badges: Badge[] }) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const lockedBadges = badges.filter((b) => !b.isUnlocked);

  const filteredBadges =
    filter === "all"
      ? [...unlockedBadges, ...lockedBadges]
      : filter === "unlocked"
      ? unlockedBadges
      : lockedBadges;

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "Tous", count: badges.length },
          { id: "unlocked", label: "Débloqués", count: unlockedBadges.length },
          { id: "locked", label: "À débloquer", count: lockedBadges.length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              filter === f.id
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:text-white"
            )}
          >
            {f.label}
            <span className={cn("opacity-60", filter === f.id ? "text-black/50" : "")}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredBadges.map((badge, index) => {
          const IconComponent = ICON_MAP[badge.icon_name] || Trophy;
          const rarity = (badge.rarity || "common") as Rarity;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <HoloBadge
                title={badge.title}
                description={badge.description}
                icon={IconComponent}
                rarity={rarity}
                isLocked={!badge.isUnlocked}
                progress={badge.progress || 0}
              />
            </motion.div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Aucun badge dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}
