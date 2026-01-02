/**
 * CineVault - Unlockables Showcase Component
 * 
 * Affiche les fonctionnalités débloquables avec progression visuelle
 * Design minimaliste avec effet de déblocage satisfaisant
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchUnlockableFeatures, 
  getUserStats,
  UnlockableFeature, 
  UserStats 
} from "@/services/unlockablesService";
import { RARITY_CONFIG, type Rarity, getLevelFromXp } from "@/data/videoClubData";
import { cn } from "@/lib/utils";
import {
  Lock,
  Unlock,
  BarChart3,
  FileText,
  Heart,
  ListVideo,
  Download,
  TrendingUp,
  Share2,
  PieChart,
  LayoutGrid,
  Bell,
  CreditCard,
  Box,
  LineChart,
  History,
  Code,
  Award,
  Sparkles,
  Frame,
  Zap,
  Shield,
  Gem,
  Snowflake,
  ShieldCheck,
  Gift,
  ChevronRight,
  Star,
} from "lucide-react";
import type { ElementType } from "react";

const ICON_MAP: Record<string, ElementType> = {
  BarChart3,
  FileText,
  Heart,
  ListVideo,
  Download,
  TrendingUp,
  Share2,
  PieChart,
  LayoutGrid,
  Bell,
  CreditCard,
  Box,
  LineChart,
  History,
  Code,
  Award,
  Sparkles,
  Frame,
  Zap,
  Shield,
  Gem,
  Snowflake,
  ShieldCheck,
  Gift,
};

const CATEGORY_LABELS: Record<string, string> = {
  feature: "Fonctionnalités",
  cosmetic: "Cosmétiques",
  social: "Social",
  stats: "Statistiques",
};

const UNLOCK_TYPE_LABELS: Record<string, string> = {
  level: "Niveau",
  xp: "XP",
  badge_count: "Badges",
  movie_count: "Films",
  streak: "Streak",
};

interface UnlockableCardProps {
  feature: UnlockableFeature;
  stats: UserStats;
}

function UnlockableCard({ feature, stats }: UnlockableCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const rarity = feature.rarity as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ICON_MAP[feature.icon_name] || Gift;
  const isUnlocked = feature.isUnlocked;
  const progress = feature.progress || 0;

  // Valeur actuelle et cible
  const getCurrentValue = () => {
    switch (feature.unlock_type) {
      case 'level': return stats.level;
      case 'xp': return stats.xp;
      case 'badge_count': return stats.badge_count;
      case 'movie_count': return stats.movie_count;
      case 'streak': return stats.streak;
      default: return 0;
    }
  };

  const currentValue = getCurrentValue();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
      onClick={() => setShowDetails(!showDetails)}
      className={cn(
        "relative rounded-2xl p-4 cursor-pointer transition-all overflow-hidden",
        isUnlocked 
          ? "bg-white/10 border border-white/20 hover:border-white/40" 
          : "bg-white/5 border border-white/10"
      )}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 30% 30%, ${rarityConfig.glowColor}, transparent 70%)` 
          }}
        />
      )}

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div 
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            isUnlocked ? "bg-white/10" : "bg-white/5"
          )}
          style={{
            borderColor: isUnlocked ? rarityConfig.glowColor : undefined,
            borderWidth: isUnlocked ? 1 : 0,
          }}
        >
          {isUnlocked ? (
            <IconComponent className="w-6 h-6" style={{ color: rarityConfig.glowColor }} />
          ) : (
            <Lock className="w-5 h-5 text-white/30" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-semibold text-sm truncate",
              isUnlocked ? "text-white" : "text-white/50"
            )}>
              {feature.name}
            </h4>
            
            {/* Rarity badge */}
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: isUnlocked ? `${rarityConfig.glowColor}30` : 'rgba(255,255,255,0.1)',
                color: isUnlocked ? rarityConfig.glowColor : 'rgba(255,255,255,0.3)',
              }}
            >
              {rarity}
            </span>
          </div>

          <p className={cn(
            "text-xs leading-relaxed mb-3",
            isUnlocked ? "text-white/60" : "text-white/30"
          )}>
            {feature.description}
          </p>

          {/* Progress bar */}
          {!isUnlocked && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">
                  {UNLOCK_TYPE_LABELS[feature.unlock_type]} {currentValue} / {feature.unlock_value}
                </span>
                <span className="text-white/60 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${rarityConfig.glowColor}80, ${rarityConfig.glowColor})` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Unlocked indicator */}
          {isUnlocked && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: rarityConfig.glowColor }}>
              <Unlock className="w-3.5 h-3.5" />
              <span className="font-medium">Débloqué</span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className={cn(
          "w-4 h-4 shrink-0 transition-transform",
          showDetails ? "rotate-90" : "",
          isUnlocked ? "text-white/40" : "text-white/20"
        )} />
      </div>
    </motion.div>
  );
}

interface UnlockablesShowcaseProps {
  className?: string;
}

export function UnlockablesShowcase({ className }: UnlockablesShowcaseProps) {
  const { user, profile } = useAuth();
  const [features, setFeatures] = useState<UnlockableFeature[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [featuresData, statsData] = await Promise.all([
          fetchUnlockableFeatures(user.id),
          getUserStats(user.id),
        ]);

        setFeatures(featuresData);
        setStats(statsData);
      } catch (error) {
        console.error("Error loading unlockables:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!user || !stats) {
    return null;
  }

  const categories = ["all", ...new Set(features.map(f => f.category))];
  const filteredFeatures = selectedCategory === "all" 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const unlockedCount = features.filter(f => f.isUnlocked).length;
  const totalCount = features.length;

  // Grouper par type de déblocage pour une vue "roadmap"
  const levelFeatures = filteredFeatures.filter(f => f.unlock_type === 'level')
    .sort((a, b) => a.unlock_value - b.unlock_value);
  const otherFeatures = filteredFeatures.filter(f => f.unlock_type !== 'level');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Récompenses à débloquer</h3>
          <p className="text-sm text-white/50">
            {unlockedCount} / {totalCount} débloquées
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-white">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-bold">Niveau {stats.level}</span>
          </div>
          <p className="text-xs text-white/50">{stats.xp.toLocaleString()} XP</p>
        </div>
      </div>

      {/* Global progress */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">Progression globale</span>
          <span className="text-white font-medium">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const count = cat === "all" 
            ? features.length 
            : features.filter(f => f.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === cat
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:text-white"
              )}
            >
              {cat === "all" ? "Toutes" : CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Level roadmap */}
      {levelFeatures.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
            Progression par niveau
          </h4>
          <div className="space-y-3">
            {levelFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <UnlockableCard feature={feature} stats={stats} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Other unlockables */}
      {otherFeatures.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
            Récompenses spéciales
          </h4>
          <div className="space-y-3">
            {otherFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <UnlockableCard feature={feature} stats={stats} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Aucune récompense dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}

export default UnlockablesShowcase;
