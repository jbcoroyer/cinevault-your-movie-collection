/**
 * CineVault - Badges Page (CORRIGÉ)
 *
 * CORRECTIONS:
 * - Ajout du StreakDisplay en haut de la section progression
 * - Ajout des SeasonalEvents (événements saisonniers) avant WeeklyChallenges
 * - Meilleure organisation de l'affichage gamification
 */

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, Badge } from "@/services/badgeService";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { BadgesShowcase } from "@/components/guest/BadgesShowcase";
import { MemberCard3DModal } from "@/components/gamification/MemberCard3DModal";
import { CinevaultMemberCard } from "@/components/gamification/CinevaultMemberCard";
import { WeeklyChallenges } from "@/components/gamification/WeeklyChallenges";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { SeasonalEvents } from "@/components/gamification/SeasonalEvents";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { cn } from "@/lib/utils";
import { type Rarity, RARITY_CONFIG } from "@/data/videoClubData";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronRight,
  Palette,
  Frame,
  Tag,
  Check,
} from "lucide-react";

// Map des icônes pour les badges
const ICON_MAP: Record<string, React.ElementType> = {
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

// Catégories de badges
const BADGE_CATEGORIES = [
  { id: "collection", label: "Collection", icon: Library },
  { id: "format", label: "Formats", icon: Disc },
  { id: "social", label: "Social", icon: Users },
  { id: "secret", label: "Secrets", icon: Sparkles },
];

// Options de personnalisation
const AVAILABLE_FRAMES = [
  { id: "default", name: "Classique", color: "hsl(var(--primary))" },
  { id: "frame_gold", name: "Or", color: "#EAB308" },
  { id: "frame_neon", name: "Néon", color: "#22D3EE" },
  { id: "frame_fire", name: "Feu", color: "#F97316" },
];

const AVAILABLE_THEMES = [
  { id: "default", name: "Classique" },
  { id: "theme_cinema", name: "Cinéma" },
  { id: "theme_retro", name: "Rétro" },
  { id: "theme_neon", name: "Néon" },
];

// ============================================
// Badge Card Components
// ============================================

function MobileBadgeCard({ badge }: { badge: Badge }) {
  const isLocked = !badge.isUnlocked;
  const rarity = (badge.rarity || "common") as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ICON_MAP[badge.icon_name] || Trophy;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all",
        isLocked
          ? "bg-muted/30 border border-border/30"
          : "bg-gradient-to-r from-card/80 to-card/40 border border-white/10",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          isLocked ? "bg-muted/50" : "",
        )}
        style={{
          background: isLocked
            ? undefined
            : `linear-gradient(135deg, ${rarityConfig.color}20, ${rarityConfig.color}40)`,
          borderColor: isLocked ? undefined : `${rarityConfig.color}50`,
          borderWidth: isLocked ? 0 : 1,
        }}
      >
        {isLocked ? (
          <Lock className="w-5 h-5 text-muted-foreground/50" />
        ) : (
          <IconComponent className="w-5 h-5" style={{ color: rarityConfig.color }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={cn("font-semibold text-sm truncate", isLocked && "text-muted-foreground/70")}>{badge.title}</h4>
        <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        {isLocked ? (
          <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary/50 rounded-full" style={{ width: `${badge.progress || 0}%` }} />
          </div>
        ) : (
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
            style={{ backgroundColor: `${rarityConfig.color}20`, color: rarityConfig.color }}
          >
            {rarityConfig.label}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">+{badge.xp_reward} XP</span>
      </div>
    </div>
  );
}

function DesktopBadgeCard({ badge }: { badge: Badge }) {
  const isLocked = !badge.isUnlocked;
  const rarity = (badge.rarity || "common") as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ICON_MAP[badge.icon_name] || Trophy;

  return (
    <div
      className={cn(
        "group relative aspect-square p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer",
        isLocked ? "bg-muted/30 border border-border/30 hover:bg-muted/40" : "border hover:scale-105 hover:shadow-lg",
      )}
      style={{
        background: isLocked ? undefined : `linear-gradient(135deg, ${rarityConfig.color}10, ${rarityConfig.color}25)`,
        borderColor: isLocked ? undefined : `${rarityConfig.color}40`,
        boxShadow: isLocked ? undefined : `0 0 20px ${rarityConfig.color}15`,
      }}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
          isLocked ? "bg-muted/50" : "",
        )}
        style={{
          background: isLocked
            ? undefined
            : `linear-gradient(135deg, ${rarityConfig.color}30, ${rarityConfig.color}50)`,
        }}
      >
        {isLocked ? (
          <Lock className="w-5 h-5 text-muted-foreground/50" />
        ) : (
          <IconComponent className="w-5 h-5" style={{ color: rarityConfig.color }} />
        )}
      </div>

      <h4
        className={cn(
          "font-display font-bold uppercase tracking-wide text-[10px] leading-tight",
          isLocked ? "text-muted-foreground/50" : "text-foreground",
        )}
      >
        {badge.title}
      </h4>

      <div className="mt-1.5">
        {isLocked ? (
          <div className="w-10 h-1 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary/50 rounded-full" style={{ width: `${badge.progress || 0}%` }} />
          </div>
        ) : (
          <span
            className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase border bg-black/20"
            style={{ borderColor: `${rarityConfig.color}50`, color: rarityConfig.color }}
          >
            {rarityConfig.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export default function Badges() {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentLevel, currentXp, progressPercent, xpToNextLevel } = useBadgeNotification();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [movieCount, setMovieCount] = useState(0);
  const [isCard3DOpen, setIsCard3DOpen] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(profile?.equipped_frame || "default");
  const [selectedTheme, setSelectedTheme] = useState(profile?.equipped_theme || "default");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedFrame(profile.equipped_frame || "default");
      setSelectedTheme(profile.equipped_theme || "default");
    }
  }, [profile]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const [badgesData, physicalMovies] = await Promise.all([fetchAllBadges(user.id), getPhysicalMovies(user.id)]);
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

  const handleSaveCustomization = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          equipped_frame: selectedFrame,
          equipped_theme: selectedTheme,
        })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error saving customization:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Stats
  const totalUnlocked = badges.filter((b) => b.isUnlocked).length;
  const totalBadges = badges.length;

  // Non connecté = showcase de démonstration
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="pt-14 md:pt-0">
          <BadgesShowcase />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="pt-14 md:pt-0 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header avec Carte Membre */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Carte Membre Interactive */}
          <div className="md:w-80 flex-shrink-0">
            <div onClick={() => setIsCard3DOpen(true)} className="cursor-pointer">
              <CinevaultMemberCard
                username={profile?.username || "Membre"}
                avatarUrl={profile?.avatar_url || undefined}
                totalXp={profile?.total_xp || 0}
                movieCount={movieCount}
                joinDate={profile?.created_at || undefined}
                equippedTitle={profile?.current_title}
                equippedFrame={selectedFrame}
                equippedTheme={selectedTheme}
                className="hover:scale-[1.02] transition-transform"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">Cliquez pour voir en 3D</p>
          </div>

          {/* Stats & Progression */}
          <div className="flex-1 space-y-4">
            {/* CORRECTION: Ajout du StreakDisplay */}
            <StreakDisplay className="mb-4" />

            {/* XP Progress */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Niveau</p>
                    <p className="text-2xl font-bold">{currentLevel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">XP Total</p>
                  <p className="text-lg font-semibold text-primary">{currentXp.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Niveau {currentLevel}</span>
                  <span>{xpToNextLevel} XP restants</span>
                  <span>Niveau {currentLevel + 1}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {/* Badges Progress */}
            <div className="p-4 rounded-xl bg-card/50 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">Badges Débloqués</span>
                </div>
                <span className="text-lg font-bold">
                  {totalUnlocked} <span className="text-muted-foreground font-normal">/ {totalBadges}</span>
                </span>
              </div>
              <Progress value={(totalUnlocked / totalBadges) * 100} className="h-2 mt-2" />
            </div>
          </div>
        </div>

        {/* CORRECTION: Ajout des SeasonalEvents */}
        <div className="mb-6">
          <SeasonalEvents />
        </div>

        {/* Weekly Challenges Section */}
        <div className="mb-6">
          <WeeklyChallenges />
        </div>

        {/* Badges by Category */}
        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4 h-auto p-1">
            {BADGE_CATEGORIES.map((cat) => {
              const categoryBadges = badges.filter((b) => b.category === cat.id);
              const unlockedCount = categoryBadges.filter((b) => b.isUnlocked).length;

              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex flex-col items-center gap-0.5 py-2 px-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500"
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium hidden xs:block">{cat.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50">
                    {unlockedCount}/{categoryBadges.length}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {BADGE_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0 focus-visible:outline-none">
              {loading ? (
                <div className="space-y-2 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-3 md:space-y-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 md:aspect-square rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Mobile: List View */}
                  <div className="space-y-2 md:hidden">
                    {badges
                      .filter((b) => b.category === cat.id)
                      .sort((a, b) => (b.isUnlocked ? 1 : 0) - (a.isUnlocked ? 1 : 0))
                      .map((badge) => (
                        <MobileBadgeCard key={badge.id} badge={badge} />
                      ))}
                  </div>

                  {/* Desktop: Grid View */}
                  <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {badges
                      .filter((b) => b.category === cat.id)
                      .map((badge) => (
                        <DesktopBadgeCard key={badge.id} badge={badge} />
                      ))}
                  </div>
                </>
              )}

              {!loading && badges.filter((b) => b.category === cat.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted border border-border/50 flex items-center justify-center mb-3">
                    <cat.icon className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aucun badge dans cette catégorie.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* 3D Modal */}
      {user && profile && (
        <MemberCard3DModal
          isOpen={isCard3DOpen}
          onClose={() => setIsCard3DOpen(false)}
          username={profile.username || "Membre"}
          avatarUrl={profile.avatar_url || undefined}
          totalXp={profile.total_xp || 0}
          movieCount={movieCount}
          joinDate={profile.created_at || undefined}
          equippedTitle={profile.current_title}
          equippedFrame={profile.equipped_frame}
          equippedTheme={profile.equipped_theme}
          badgeCount={totalUnlocked}
        />
      )}

      <BottomNav />
    </div>
  );
}
