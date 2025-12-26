/**
 * CineVault - Badges Page
 *
 * Page de badges avec:
 * - MinimalHeader + FloatingDock (navigation cohérente)
 * - Progression XP et niveau
 * - Grille de badges par catégorie
 */

import { useEffect, useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, Badge } from "@/services/badgeService";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
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
} from "lucide-react";

const ICON_MAP: Record<string, ElementType> = {
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
  Trophy,
  Clapperboard: Film,
  Archive: Library,
  Brick: Library,
  Store: Library,
};

const BADGE_CATEGORIES = [
  { id: "collection", label: "Collection", icon: Library },
  { id: "format", label: "Formats", icon: Disc },
  { id: "social", label: "Social", icon: Users },
  { id: "secret", label: "Secrets", icon: Sparkles },
];

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
  if (level >= 50) return "Légende du Cinéma";
  if (level >= 40) return "Maître Projectionniste";
  if (level >= 30) return "Archiviste Expert";
  if (level >= 20) return "Collectionneur Pro";
  if (level >= 15) return "Cinéphile Passionné";
  if (level >= 10) return "Amateur Éclairé";
  if (level >= 5) return "Novice Curieux";
  return "Nouveau Membre";
};

function BadgeCard({ badge }: { badge: Badge }) {
  const isLocked = !badge.isUnlocked;
  const rarity = (badge.rarity || "common") as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ICON_MAP[badge.icon_name] || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isLocked ? 1 : 1.05 }}
      className={cn(
        "aspect-square p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all",
        isLocked ? "bg-white/5 border border-white/10" : "bg-white/10 border border-white/20 hover:border-white/40",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
          isLocked ? "bg-white/5" : "bg-white/10",
        )}
        style={{
          color: isLocked ? "rgba(255,255,255,0.2)" : rarityConfig.color,
        }}
      >
        {isLocked ? <Lock className="w-5 h-5" /> : <IconComponent className="w-6 h-6" />}
      </div>

      <h4
        className={cn(
          "text-xs font-semibold uppercase tracking-wide leading-tight mb-1",
          isLocked ? "text-white/30" : "text-white",
        )}
      >
        {badge.title}
      </h4>

      <p className={cn("text-[10px] leading-tight", isLocked ? "text-white/20" : "text-white/50")}>
        {badge.description}
      </p>

      <div className="mt-2">
        {isLocked ? (
          <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/30 rounded-full" style={{ width: `${badge.progress || 0}%` }} />
          </div>
        ) : (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${rarityConfig.color}20`,
              color: rarityConfig.color,
            }}
          >
            {rarity}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function Badges() {
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();
  const { markBadgesAsSeen, markRewardsAsSeen } = useBadgeNotification();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionCount, setCollectionCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalXp = profile?.total_xp || 0;
  const { level, currentLevelXp, xpForNextLevel, progress } = calculateLevel(totalXp);
  const levelTitle = getLevelTitle(level);

  useEffect(() => {
    markBadgesAsSeen();
    markRewardsAsSeen();
  }, [markBadgesAsSeen, markRewardsAsSeen]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [badgesData, physicalMovies] = await Promise.all([fetchAllBadges(user.id), getPhysicalMovies(user.id)]);

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

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const filteredBadges = selectedCategory === "all" ? badges : badges.filter((b) => b.category === selectedCategory);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="h-10 w-40 bg-white/5 animate-pulse rounded mb-8" />
            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="bg-white/5 p-6 rounded-2xl animate-pulse h-32" />
              <div className="bg-white/5 p-6 rounded-2xl animate-pulse h-32" />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-2xl" />
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
        <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-4xl mx-auto text-center py-20">
          <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-4">Débloquez des badges</h1>
          <p className="text-white/50 mb-8">Connectez-vous pour voir votre progression et vos badges</p>
          <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90">
            Se connecter
          </Button>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </motion.button>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Mes Badges</h1>
            <p className="text-white/50">
              {unlockedCount} / {badges.length} badges débloqués
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
          >
            {/* Level Card */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Niveau actuel</p>
                  <p className="text-2xl font-bold text-white">Niveau {level}</p>
                  <p className="text-amber-500 text-sm">{levelTitle}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Progression</span>
                  <span className="text-white">
                    {currentLevelXp} / {xpForNextLevel} XP
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* XP Card */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-purple-500" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Expérience totale</p>
                  <p className="text-2xl font-bold text-white">{totalXp.toLocaleString()} XP</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <p className="text-white/50 text-xs">Films</p>
                  <p className="text-lg font-semibold text-white">{collectionCount}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Badges</p>
                  <p className="text-lg font-semibold text-white">{unlockedCount}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
          >
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === "all" ? "bg-white text-black" : "bg-white/10 text-white/70 hover:text-white",
              )}
            >
              Tous ({badges.length})
            </button>
            {BADGE_CATEGORIES.map((cat) => {
              const count = badges.filter((b) => b.category === cat.id).length;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    selectedCategory === cat.id ? "bg-white text-black" : "bg-white/10 text-white/70 hover:text-white",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label} ({count})
                </button>
              );
            })}
          </motion.div>

          {/* Badges Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            {filteredBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <BadgeCard badge={badge} />
              </motion.div>
            ))}
          </motion.div>

          {filteredBadges.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">Aucun badge dans cette catégorie</p>
            </div>
          )}
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
