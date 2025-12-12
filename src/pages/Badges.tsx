import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, Badge } from "@/services/badgeService";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { BadgesShowcase } from "@/components/guest/BadgesShowcase";
import { PatchBadge } from "@/components/gamification/PatchBadge";
import { type Rarity } from "@/data/videoClubData";
import { MemberCard3DModal } from "@/components/gamification/MemberCard3DModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { cn } from "@/lib/utils";
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

export default function Badges() {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentLevel, currentXp, progressPercent, xpToNextLevel } = useBadgeNotification();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [movieCount, setMovieCount] = useState(0);
  const [isCard3DOpen, setIsCard3DOpen] = useState(false);

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
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          {/* Left: Title & Progress */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-amber-500" />
              Mes Badges
            </h1>

            {/* XP Progress Bar */}
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Niveau</div>
                    <div className="font-bold text-lg">{currentLevel}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">XP Total</div>
                  <div className="font-bold text-lg text-amber-500">{currentXp}</div>
                </div>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Niveau {currentLevel}</span>
                <span>{xpToNextLevel} XP pour le niveau suivant</span>
              </div>
            </div>
          </div>

          {/* Right: Stats & Card Preview */}
          <div className="flex flex-col gap-4">
            {/* Badge Stats */}
            <div className="flex gap-4">
              <div className="text-center px-6 py-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-3xl font-bold text-emerald-500">{totalUnlocked}</div>
                <div className="text-xs text-muted-foreground">Débloqués</div>
              </div>
              <div className="text-center px-6 py-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-3xl font-bold text-muted-foreground">{totalBadges - totalUnlocked}</div>
                <div className="text-xs text-muted-foreground">À débloquer</div>
              </div>
            </div>

            {/* View Member Card Button */}
            <Button
              onClick={() => setIsCard3DOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Crown className="w-4 h-4 text-amber-500" />
              Voir ma carte membre
            </Button>
          </div>
        </div>

        {/* Badges by Category */}
        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            {BADGE_CATEGORIES.map((cat) => {
              const categoryBadges = badges.filter((b) => b.category === cat.id);
              const unlockedCount = categoryBadges.filter((b) => b.isUnlocked).length;

              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex items-center gap-2 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500"
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                  {badges
                    .filter((b) => b.category === cat.id)
                    .map((badge) => {
                      const IconComponent = ICON_MAP[badge.icon_name] || Film;

                      return (
                        <PatchBadge
                          key={badge.id}
                          title={badge.title}
                          description={badge.description}
                          icon={IconComponent}
                          rarity={(badge.rarity || badge.base_rarity || "common") as Rarity}
                          isLocked={!badge.isUnlocked}
                          progress={badge.progress}
                          compact
                        />
                      );
                    })}
                </div>
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
