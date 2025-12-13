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

// Options de personnalisation disponibles
const AVAILABLE_FRAMES = [
  { id: "default", name: "Classique", color: "hsl(var(--primary))" },
  { id: "frame_gold", name: "Or", color: "#EAB308" },
  { id: "frame_neon", name: "Néon", color: "#D946EF" },
  { id: "frame_vhs", name: "VHS", color: "#22D3EE" },
  { id: "frame_film", name: "Pellicule", color: "#71717A" },
];

const AVAILABLE_THEMES = [
  { id: "default", name: "CineVault", gradient: "from-primary/20 to-secondary/20" },
  { id: "theme_midnight", name: "Minuit", gradient: "from-[#1a1a2e] to-[#16213e]" },
  { id: "theme_retro", name: "Rétro", gradient: "from-[#2d132c] to-[#4a1942]" },
  { id: "theme_neon", name: "Néon", gradient: "from-[#0d0d0d] to-[#1a1a2e]" },
  { id: "theme_golden", name: "Doré", gradient: "from-[#1c1c1c] to-[#2a2a2a]" },
];

// Composant Badge Mobile
function MobileBadgeCard({ badge }: { badge: Badge }) {
  const IconComponent = ICON_MAP[badge.icon_name] || Film;
  const rarity = (badge.rarity || badge.base_rarity || "common") as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const isLocked = !badge.isUnlocked;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all",
        isLocked
          ? "bg-muted/20 border-muted/30"
          : "bg-card/50 border-border/50",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          "border-2",
          isLocked ? "bg-muted/20 border-muted/30" : "bg-black/20",
        )}
        style={{
          borderColor: isLocked ? undefined : rarityConfig.color,
          boxShadow: isLocked ? undefined : `0 0 12px ${rarityConfig.glowColor}`,
        }}
      >
        {isLocked ? (
          <Lock className="w-5 h-5 text-muted-foreground/50" />
        ) : (
          <IconComponent className="w-5 h-5" style={{ color: rarityConfig.color }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={cn(
              "font-semibold text-sm truncate",
              isLocked && "text-muted-foreground/60",
            )}
          >
            {badge.title}
          </h4>
          {!isLocked && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0"
              style={{
                backgroundColor: `${rarityConfig.color}20`,
                color: rarityConfig.color,
              }}
            >
              {rarityConfig.label}
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-xs mt-0.5 line-clamp-2",
            isLocked ? "text-muted-foreground/40" : "text-muted-foreground",
          )}
        >
          {badge.description}
        </p>

        {/* Progress for locked badges */}
        {isLocked && badge.progress !== undefined && badge.progress > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full transition-all"
                style={{ width: `${badge.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {Math.round(badge.progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Arrow or Check */}
      <div className="shrink-0">
        {isLocked ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Badge Desktop (compact grid)
function DesktopBadgeCard({ badge }: { badge: Badge }) {
  const IconComponent = ICON_MAP[badge.icon_name] || Film;
  const rarity = (badge.rarity || badge.base_rarity || "common") as Rarity;
  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const isLocked = !badge.isUnlocked;

  return (
    <div
      className={cn(
        "relative aspect-square rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center transition-all group",
        isLocked
          ? "bg-muted/10 border-muted/20 grayscale"
          : "bg-gradient-to-br hover:scale-105 hover:-rotate-1",
        !isLocked && rarityConfig.bgGradient,
      )}
      style={{
        borderColor: isLocked ? undefined : rarityConfig.color,
      }}
    >
      {/* Glow effect on hover */}
      {!isLocked && (
        <div
          className="absolute -inset-1 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity -z-10"
          style={{ backgroundColor: rarityConfig.glowColor }}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mb-2",
          isLocked ? "bg-muted/20" : "bg-black/30",
        )}
      >
        {isLocked ? (
          <Lock className="w-5 h-5 text-muted-foreground/50" />
        ) : (
          <IconComponent className="w-5 h-5" style={{ color: rarityConfig.color }} />
        )}
      </div>

      {/* Title */}
      <h4
        className={cn(
          "font-display font-bold uppercase tracking-wide text-[10px] leading-tight",
          isLocked ? "text-muted-foreground/50" : "text-foreground",
        )}
      >
        {badge.title}
      </h4>

      {/* Rarity or Progress */}
      <div className="mt-1.5">
        {isLocked ? (
          <div className="w-10 h-1 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/50 rounded-full"
              style={{ width: `${badge.progress || 0}%` }}
            />
          </div>
        ) : (
          <span
            className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase border bg-black/20"
            style={{
              borderColor: `${rarityConfig.color}50`,
              color: rarityConfig.color,
            }}
          >
            {rarityConfig.label}
          </span>
        )}
      </div>
    </div>
  );
}

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
        const [badgesData, physicalMovies] = await Promise.all([
          fetchAllBadges(user.id),
          getPhysicalMovies(user.id),
        ]);
        setBadges(badgesData);
        setMovieCount(physicalMovies.length);
      } catch (error) {
        console.error("Error loading badges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const saveCustomization = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.from("profiles").update({
        equipped_frame: selectedFrame,
        equipped_theme: selectedTheme,
      }).eq("id", user.id);
    } catch (error) {
      console.error("Error saving customization:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = profile && (
    selectedFrame !== (profile.equipped_frame || "default") ||
    selectedTheme !== (profile.equipped_theme || "default")
  );

  const totalUnlocked = badges.filter((b) => b.isUnlocked).length;
  const totalBadges = badges.length;

  // Loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Si non connecté, afficher le showcase
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

  // Contenu pour les utilisateurs connectés
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-4 md:py-6 max-w-6xl">
        {/* ===== MOBILE: Carte membre en vedette + Personnalisation ===== */}
        <div className="md:hidden space-y-4 mb-6">
          {/* Titre mobile */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Ma Carte
            </h1>
          </div>

          {/* Carte Membre Premium - Mobile Hero */}
          <div 
            onClick={() => setIsCard3DOpen(true)}
            className="cursor-pointer active:scale-[0.98] transition-transform"
          >
            <CinevaultMemberCard
              username={profile?.username || "Membre"}
              avatarUrl={profile?.avatar_url || undefined}
              totalXp={profile?.total_xp || 0}
              movieCount={movieCount}
              joinDate={profile?.created_at || undefined}
              equippedTitle={profile?.current_title}
              equippedFrame={selectedFrame}
              equippedTheme={selectedTheme}
              className="w-full"
            />
            <p className="text-center text-xs text-muted-foreground mt-2">
              Appuyez pour voir en 3D
            </p>
          </div>

          {/* Section Personnalisation Mobile */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Personnaliser ma carte</h2>
            </div>

            {/* Choix du cadre */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Frame className="w-4 h-4" />
                <span>Cadre</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      selectedFrame === frame.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-background hover:bg-muted/50"
                    )}
                    style={{
                      borderColor: selectedFrame === frame.id ? frame.color : undefined,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {selectedFrame === frame.id && <Check className="w-3 h-3" />}
                      {frame.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Choix du thème */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                <span>Thème</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      selectedTheme === theme.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-background hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {selectedTheme === theme.id && <Check className="w-3 h-3" />}
                      {theme.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton sauvegarder */}
            {hasChanges && (
              <Button 
                onClick={saveCustomization} 
                disabled={isSaving}
                className="w-full"
                size="sm"
              >
                {isSaving ? "Sauvegarde..." : "Appliquer les changements"}
              </Button>
            )}
          </div>

          {/* Stats compactes mobile */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center py-3 rounded-xl bg-card/50 border border-border/50">
              <div className="text-xl font-bold text-emerald-500">{totalUnlocked}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Badges</div>
            </div>
            <div className="text-center py-3 rounded-xl bg-card/50 border border-border/50">
              <div className="text-xl font-bold text-amber-500">{currentLevel}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Niveau</div>
            </div>
            <div className="text-center py-3 rounded-xl bg-card/50 border border-border/50">
              <div className="text-xl font-bold text-primary">{currentXp}</div>
              <div className="text-[10px] text-muted-foreground uppercase">XP</div>
            </div>
          </div>

          {/* Progress XP mobile */}
          <div className="bg-card/30 rounded-xl border border-border/30 p-3">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="text-muted-foreground">{xpToNextLevel} XP → Niv. {currentLevel + 1}</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>

        {/* ===== DESKTOP: Layout original ===== */}
        <div className="hidden md:block space-y-4 mb-6">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500" />
              Mes Badges
            </h1>
            <Button
              onClick={() => setIsCard3DOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Crown className="w-4 h-4 text-amber-500" />
              Ma carte
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex gap-3">
            <div className="flex-1 text-center py-3 rounded-xl bg-card/50 border border-border/50">
              <div className="text-2xl font-bold text-emerald-500">{totalUnlocked}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Débloqués</div>
            </div>
            <div className="flex-1 text-center py-3 rounded-xl bg-card/50 border border-border/50">
              <div className="text-2xl font-bold text-muted-foreground">{totalBadges - totalUnlocked}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">À débloquer</div>
            </div>
            <div className="flex-1 text-center py-3 rounded-xl bg-card/50 border border-border/50">
              <div className="text-2xl font-bold text-amber-500">{currentLevel}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Niveau</div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">{currentXp} XP</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {xpToNextLevel} XP → Niv. {currentLevel + 1}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
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
            <TabsContent
              key={cat.id}
              value={cat.id}
              className="mt-0 focus-visible:outline-none"
            >
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
                  <p className="text-sm text-muted-foreground">
                    Aucun badge dans cette catégorie.
                  </p>
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
