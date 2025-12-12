import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, Badge } from "@/services/badgeService";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { PatchBadge } from "@/components/gamification/PatchBadge";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { WeeklyChallenges } from "@/components/gamification/WeeklyChallenges";
import { SeasonalEvents } from "@/components/gamification/SeasonalEvents";
import { RewardsShowcase } from "@/components/gamification/RewardsShowcase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Disc, Archive, Sparkles, Film, Globe, Clock, Users, Flame, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_MAP, LORE_TERMINOLOGY } from "@/data/videoClubData";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import type { Rarity } from "@/data/videoClubData";

// Catégories pour les tabs
const BADGE_CATEGORIES = [
  { id: "collection", title: "Collection", icon: Archive, color: "videoclub-cyan" },
  { id: "format", title: "Formats", icon: Disc, color: "videoclub-magenta" },
  { id: "genre", title: "Genres", icon: Film, color: "videoclub-gold" },
  { id: "decade", title: "Décennies", icon: Clock, color: "videoclub-cyan" },
  { id: "director", title: "Réalisateurs", icon: Clapperboard, color: "videoclub-magenta" },
  { id: "world", title: "Monde", icon: Globe, color: "videoclub-gold" },
  { id: "community", title: "Communauté", icon: Users, color: "videoclub-cyan" },
  { id: "streak", title: "Streaks", icon: Flame, color: "videoclub-magenta" },
];

export default function BadgesPage() {
  const { user } = useAuth();
  const { currentXp, currentLevel } = useBadgeNotification();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const totalUnlocked = badges.filter((b) => b.isUnlocked).length;

  useEffect(() => {
    loadBadges();
  }, [user]);

  const loadBadges = async () => {
    setLoading(true);
    if (user) {
      const data = await fetchAllBadges(user.id);
      setBadges(data);
    } else {
      const data = await fetchAllBadges(null);
      setBadges(data);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-videoclub-cyan" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-8 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-videoclub-cyan/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-videoclub-cyan/10 border border-videoclub-cyan/20 text-videoclub-cyan text-sm font-mono font-medium mb-6 animate-fade-in">
            <Trophy className="w-4 h-4" />
            <span>{LORE_TERMINOLOGY.level} {currentLevel}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 text-white">
            Vos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta">
              {LORE_TERMINOLOGY.badges}
            </span>
          </h1>

          <p className="text-muted-foreground max-w-lg mx-auto text-lg mb-8 font-mono">
            {totalUnlocked} débloqués • {currentXp.toLocaleString()} {LORE_TERMINOLOGY.xp}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 space-y-8">
        {/* Gamification Widgets - Only for logged in users */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <StreakDisplay />
            </div>
            <div className="lg:col-span-2">
              <WeeklyChallenges />
            </div>
          </div>
        )}

        {/* Seasonal Events */}
        {user && <SeasonalEvents />}

        {/* Rewards Showcase */}
        {user && <RewardsShowcase />}

        {/* Badges Tabs */}
        <Tabs defaultValue="collection" className="w-full space-y-8">
          {/* Navigation */}
          <div className="flex justify-center overflow-x-auto pb-2">
            <TabsList className="bg-videoclub-surface border border-videoclub-cyan/20 p-1.5 h-auto rounded-full backdrop-blur-md flex-wrap justify-center">
              {BADGE_CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className={cn(
                    "rounded-full px-4 py-2 font-mono transition-all gap-2 text-xs sm:text-sm sm:px-6 sm:py-3",
                    "data-[state=active]:bg-videoclub-cyan/20 data-[state=active]:text-videoclub-cyan"
                  )}
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content */}
          {BADGE_CATEGORIES.map((cat) => (
            <TabsContent
              key={cat.id}
              value={cat.id}
              className="animate-in fade-in slide-in-from-bottom-8 duration-500 focus-visible:outline-none"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
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
                      />
                    );
                  })}
              </div>

              {badges.filter((b) => b.category === cat.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-videoclub-surface border border-videoclub-cyan/20 flex items-center justify-center">
                    <cat.icon className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-mono">
                    Aucun écusson dans cette catégorie.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
