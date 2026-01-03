/**
 * CineVault - Unlockables Showcase Component
 * 
 * Affiche les fonctionnalités débloquables avec navigation vers les features
 * Design minimaliste avec expérience professionnelle
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchUnlockableFeatures, 
  getUserStats,
  UnlockableFeature, 
  UserStats 
} from "@/services/unlockablesService";
import { RARITY_CONFIG, type Rarity, getLevelFromXp } from "@/data/videoClubData";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
  ExternalLink,
  Palette,
  User,
  Crown,
  Check,
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
  Palette,
  User,
  Crown,
};

const CATEGORY_INFO: Record<string, { label: string; icon: ElementType; description: string }> = {
  feature: { 
    label: "Fonctionnalités", 
    icon: Zap,
    description: "Nouvelles fonctionnalités à débloquer"
  },
  cosmetic: { 
    label: "Cosmétiques", 
    icon: Palette,
    description: "Personnalisez votre profil"
  },
  social: { 
    label: "Social", 
    icon: User,
    description: "Options sociales avancées"
  },
  stats: { 
    label: "Statistiques", 
    icon: BarChart3,
    description: "Analyses détaillées de votre collection"
  },
};

const UNLOCK_TYPE_LABELS: Record<string, { label: string; icon: ElementType }> = {
  level: { label: "Niveau", icon: Star },
  xp: { label: "XP", icon: Zap },
  badge_count: { label: "Badges", icon: Award },
  movie_count: { label: "Films", icon: Box },
  streak: { label: "Streak", icon: Sparkles },
};

// Navigation mapping for unlocked features
const FEATURE_NAVIGATION: Record<string, { path: string; action?: string }> = {
  // Stats features
  'stats_advanced': { path: '/collection', action: 'Voir ma collection' },
  'stats_valuation': { path: '/collection', action: 'Estimer ma collection' },
  'stats_timeline': { path: '/collection', action: 'Voir la timeline' },
  'stats_director': { path: '/collection', action: 'Analyser par réalisateur' },
  'stats_export': { path: '/collection', action: 'Exporter les données' },
  
  // Social features  
  'social_share': { path: '/profile', action: 'Partager mon profil' },
  'social_lists': { path: '/lists', action: 'Créer des listes' },
  'social_reviews': { path: '/profile', action: 'Voir mes critiques' },
  
  // Cosmetic features
  'cosmetic_frame': { path: '/profile', action: 'Personnaliser mon cadre' },
  'cosmetic_theme': { path: '/profile', action: 'Changer le thème' },
  'cosmetic_title': { path: '/profile', action: 'Choisir mon titre' },
  'cosmetic_badge': { path: '/badges', action: 'Voir mes badges' },
  
  // Feature unlocks
  'feature_alerts': { path: '/collection', action: 'Configurer les alertes' },
  'feature_wishlist': { path: '/collection', action: 'Voir ma wishlist' },
  'feature_history': { path: '/collection', action: 'Historique des prix' },
};

interface UnlockableCardProps {
  feature: UnlockableFeature;
  stats: UserStats;
  onSelect: (feature: UnlockableFeature) => void;
}

function UnlockableCard({ feature, stats, onSelect }: UnlockableCardProps) {
  const rarity = feature.rarity as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ICON_MAP[feature.icon_name] || Gift;
  const isUnlocked = feature.isUnlocked;
  const progress = feature.progress || 0;
  const unlockTypeInfo = UNLOCK_TYPE_LABELS[feature.unlock_type];

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
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(feature)}
      className={cn(
        "relative w-full text-left rounded-xl p-4 transition-all overflow-hidden",
        "focus:outline-none focus:ring-2 focus:ring-white/20",
        isUnlocked 
          ? "bg-white/10 border border-white/20 hover:border-white/40" 
          : "bg-white/5 border border-white/10 hover:bg-white/[0.07]"
      )}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 20% 20%, ${rarityConfig.glowColor}, transparent 60%)` 
          }}
        />
      )}

      <div className="relative z-10 flex items-center gap-3">
        {/* Icon */}
        <div 
          className={cn(
            "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            isUnlocked ? "bg-white/15" : "bg-white/5"
          )}
          style={{
            borderColor: isUnlocked ? rarityConfig.glowColor : 'transparent',
            borderWidth: isUnlocked ? 1 : 0,
          }}
        >
          {isUnlocked ? (
            <IconComponent className="w-5 h-5" style={{ color: rarityConfig.glowColor }} />
          ) : (
            <Lock className="w-4 h-4 text-white/30" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={cn(
              "font-semibold text-sm truncate",
              isUnlocked ? "text-white" : "text-white/50"
            )}>
              {feature.name}
            </h4>
            
            {/* Rarity badge */}
            <span 
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{
                backgroundColor: isUnlocked ? `${rarityConfig.glowColor}25` : 'rgba(255,255,255,0.1)',
                color: isUnlocked ? rarityConfig.glowColor : 'rgba(255,255,255,0.3)',
              }}
            >
              {rarity}
            </span>
          </div>

          {/* Progress or status */}
          {!isUnlocked ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${rarityConfig.glowColor}60, ${rarityConfig.glowColor})` 
                  }}
                />
              </div>
              <span className="text-[10px] text-white/40 whitespace-nowrap">
                {currentValue}/{feature.unlock_value} {unlockTypeInfo?.label}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px]" style={{ color: rarityConfig.glowColor }}>
              <Check className="w-3 h-3" />
              <span className="font-medium">Débloqué</span>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <ChevronRight className={cn(
          "w-4 h-4 shrink-0",
          isUnlocked ? "text-white/40" : "text-white/20"
        )} />
      </div>
    </motion.button>
  );
}

interface FeatureDetailProps {
  feature: UnlockableFeature | null;
  stats: UserStats;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

function FeatureDetailContent({ feature, stats, onClose, onNavigate }: FeatureDetailProps) {
  if (!feature) return null;

  const rarity = feature.rarity as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ICON_MAP[feature.icon_name] || Gift;
  const isUnlocked = feature.isUnlocked;
  const progress = feature.progress || 0;
  const unlockTypeInfo = UNLOCK_TYPE_LABELS[feature.unlock_type];
  const navigation = FEATURE_NAVIGATION[feature.id];

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
  const remaining = feature.unlock_value - currentValue;

  const handleNavigate = () => {
    if (navigation?.path) {
      onNavigate(navigation.path);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with icon */}
      <div className="flex items-start gap-4">
        <div 
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center shrink-0",
            isUnlocked ? "bg-white/15" : "bg-white/5"
          )}
          style={{
            borderColor: isUnlocked ? rarityConfig.glowColor : 'transparent',
            borderWidth: isUnlocked ? 2 : 0,
            boxShadow: isUnlocked ? `0 0 20px ${rarityConfig.glowColor}40` : 'none',
          }}
        >
          {isUnlocked ? (
            <IconComponent className="w-8 h-8" style={{ color: rarityConfig.glowColor }} />
          ) : (
            <Lock className="w-7 h-7 text-white/30" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                backgroundColor: isUnlocked ? `${rarityConfig.glowColor}25` : 'rgba(255,255,255,0.1)',
                color: isUnlocked ? rarityConfig.glowColor : 'rgba(255,255,255,0.3)',
              }}
            >
              {rarity}
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              {CATEGORY_INFO[feature.category]?.label}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{feature.name}</h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed">
        {feature.description}
      </p>

      {/* Progress section */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unlockTypeInfo && (
              <>
                <unlockTypeInfo.icon className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/60">Condition: {unlockTypeInfo.label}</span>
              </>
            )}
          </div>
          <span className="text-sm font-medium text-white">
            {currentValue} / {feature.unlock_value}
          </span>
        </div>

        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ 
              background: isUnlocked 
                ? `linear-gradient(90deg, ${rarityConfig.glowColor}, ${rarityConfig.glowColor})`
                : `linear-gradient(90deg, ${rarityConfig.glowColor}60, ${rarityConfig.glowColor})` 
            }}
          />
        </div>

        {!isUnlocked && remaining > 0 && (
          <p className="text-xs text-white/40">
            Plus que <span className="text-white/60 font-medium">{remaining} {unlockTypeInfo?.label.toLowerCase()}</span> pour débloquer
          </p>
        )}
      </div>

      {/* Action button */}
      {isUnlocked && navigation ? (
        <Button 
          onClick={handleNavigate}
          className="w-full bg-white text-black hover:bg-white/90 gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          {navigation.action || 'Accéder'}
        </Button>
      ) : isUnlocked ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/20 text-center">
          <div className="flex items-center justify-center gap-2 text-white">
            <Unlock className="w-5 h-5" style={{ color: rarityConfig.glowColor }} />
            <span className="font-medium">Fonctionnalité débloquée !</span>
          </div>
          <p className="text-xs text-white/50 mt-1">Disponible dans l'application</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <Lock className="w-6 h-6 text-white/30 mx-auto mb-2" />
          <p className="text-sm text-white/50">
            Continuez à progresser pour débloquer cette récompense
          </p>
        </div>
      )}
    </div>
  );
}

interface UnlockablesShowcaseProps {
  className?: string;
}

export function UnlockablesShowcase({ className }: UnlockablesShowcaseProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();
  const [features, setFeatures] = useState<UnlockableFeature[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFeature, setSelectedFeature] = useState<UnlockableFeature | null>(null);

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

  const handleFeatureSelect = (feature: UnlockableFeature) => {
    setSelectedFeature(feature);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    toast({
      title: "Redirection",
      description: `Navigation vers ${path}`,
    });
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
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

  // Sort: unlocked first, then by progress
  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return (b.progress || 0) - (a.progress || 0);
  });

  const DetailWrapper = isMobile ? Sheet : Dialog;
  const DetailContent = isMobile ? SheetContent : DialogContent;
  const DetailHeader = isMobile ? SheetHeader : DialogHeader;
  const DetailTitle = isMobile ? SheetTitle : DialogTitle;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Stats header - compact */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
        <div>
          <p className="text-xs text-white/50 mb-0.5">Progression</p>
          <p className="text-lg font-bold text-white">{unlockedCount}/{totalCount}</p>
        </div>
        <div className="flex-1 max-w-[200px]">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full"
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50 mb-0.5">Niveau</p>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-white">{stats.level}</span>
          </div>
        </div>
      </div>

      {/* Category filter - horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {categories.map((cat) => {
          const count = cat === "all" 
            ? features.length 
            : features.filter(f => f.category === cat).length;
          const unlockedInCat = cat === "all"
            ? unlockedCount
            : features.filter(f => f.category === cat && f.isUnlocked).length;
          const catInfo = cat !== "all" ? CATEGORY_INFO[cat] : null;
          const CatIcon = catInfo?.icon;
          
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-h-[36px]",
                selectedCategory === cat
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:text-white hover:bg-white/15"
              )}
            >
              {CatIcon && <CatIcon className="w-3.5 h-3.5" />}
              {cat === "all" ? "Toutes" : catInfo?.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded",
                selectedCategory === cat ? "bg-black/10" : "bg-white/10"
              )}>
                {unlockedInCat}/{count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Features grid */}
      <div className="space-y-2">
        {sortedFeatures.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <UnlockableCard 
              feature={feature} 
              stats={stats} 
              onSelect={handleFeatureSelect}
            />
          </motion.div>
        ))}

        {sortedFeatures.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">Aucune récompense dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Feature detail modal/sheet */}
      {isMobile ? (
        <Sheet open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
          <SheetContent side="bottom" className="bg-background border-white/10 rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="pb-2">
              <SheetTitle className="sr-only">Détails de la récompense</SheetTitle>
            </SheetHeader>
            <FeatureDetailContent 
              feature={selectedFeature} 
              stats={stats}
              onClose={() => setSelectedFeature(null)}
              onNavigate={handleNavigate}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
          <DialogContent className="bg-background border-white/10 max-w-md">
            <DialogHeader className="sr-only">
              <DialogTitle>Détails de la récompense</DialogTitle>
            </DialogHeader>
            <FeatureDetailContent 
              feature={selectedFeature} 
              stats={stats}
              onClose={() => setSelectedFeature(null)}
              onNavigate={handleNavigate}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default UnlockablesShowcase;
