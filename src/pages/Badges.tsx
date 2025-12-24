/**
 * CineVault - Badges Page - Radical Minimalist Design
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, Badge } from "@/services/badgeService";
import { getPhysicalMovies } from "@/services/physicalMovies";
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
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Film, Disc, Users, Star, Sparkles, Crown, Library, Heart, Eye, Zap,
  Award, Target, Flame, Shield, Gem, Tv, Clock, Gift, Trophy,
  Clapperboard: Film, Archive: Library, Brick: Library, Store: Library,
};

const BADGE_CATEGORIES = [
  { id: "collection", label: "Collection", icon: Library },
  { id: "format", label: "Formats", icon: Disc },
  { id: "social", label: "Social", icon: Users },
  { id: "secret", label: "Secrets", icon: Sparkles },
];

function BadgeCard({ badge }: { badge: Badge }) {
  const isLocked = !badge.isUnlocked;
  const rarity = (badge.rarity || "common") as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ICON_MAP[badge.icon_name] || Trophy;

  return (
    <div
      className={cn(
        "aspect-square p-4 flex flex-col items-center justify-center text-center transition-all",
        isLocked 
          ? "bg-card/30 border border-border/30" 
          : "border border-border hover:border-foreground/30"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 flex items-center justify-center mb-3",
          isLocked ? "text-muted-foreground/30" : ""
        )}
        style={{ color: isLocked ? undefined : rarityConfig.color }}
      >
        {isLocked ? (
          <Lock className="w-5 h-5" />
        ) : (
          <IconComponent className="w-6 h-6" />
        )}
      </div>

      <h4
        className={cn(
          "text-xs font-medium uppercase tracking-wide leading-tight",
          isLocked ? "text-muted-foreground/50" : "text-foreground"
        )}
      >
        {badge.title}
      </h4>

      <div className="mt-2">
        {isLocked ? (
          <div className="w-8 h-0.5 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-muted-foreground/30 rounded-full" 
              style={{ width: `${badge.progress || 0}%` }} 
            />
          </div>
        ) : (
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: rarityConfig.color }}
          >
            {rarityConfig.label}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Badges() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { currentLevel, currentXp, progressPercent, xpToNextLevel } = useBadgeNotification();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [movieCount, setMovieCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("collection");

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const [badgesData, physicalMovies] = await Promise.all([
          fetchAllBadges(user.id), 
          getPhysicalMovies(user.id)
        ]);
        setBadges(badgesData);
        setMovieCount(physicalMovies.length);
      } catch (error) {
        console.error("Error loading badges:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const totalUnlocked = badges.filter((b) => b.isUnlocked).length;
  const totalBadges = badges.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-4xl mx-auto text-center py-20">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-6">Connectez-vous pour voir vos badges</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background"
          >
            Se connecter
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-heading-mobile md:text-heading-desktop font-bold mb-8">Badges</h1>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-px bg-border mb-12"
        >
          {/* Level */}
          <div className="bg-background p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Niveau</span>
            </div>
            <div className="text-3xl font-bold mb-2">{currentLevel}</div>
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-1 bg-card" />
              <p className="text-xs text-muted-foreground">{xpToNextLevel} XP restants</p>
            </div>
          </div>

          {/* Badges */}
          <div className="bg-background p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Badges</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {totalUnlocked}
              <span className="text-muted-foreground text-lg font-normal">/{totalBadges}</span>
            </div>
            <Progress value={(totalUnlocked / totalBadges) * 100} className="h-1 bg-card" />
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-1 mb-8 overflow-x-auto pb-2"
        >
          {BADGE_CATEGORIES.map((cat) => {
            const categoryBadges = badges.filter((b) => b.category === cat.id);
            const unlockedCount = categoryBadges.filter((b) => b.isUnlocked).length;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors min-h-[44px]",
                  activeCategory === cat.id
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <cat.icon className="w-4 h-4" />
                <span>{cat.label}</span>
                <span className="text-xs opacity-60">{unlockedCount}/{categoryBadges.length}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Badges Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-px bg-border">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-px bg-border">
              {badges
                .filter((b) => b.category === activeCategory)
                .sort((a, b) => (b.isUnlocked ? 1 : 0) - (a.isUnlocked ? 1 : 0))
                .map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
          )}

          {!loading && badges.filter((b) => b.category === activeCategory).length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun badge dans cette catégorie</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
