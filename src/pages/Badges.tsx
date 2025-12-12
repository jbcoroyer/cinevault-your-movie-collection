import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, Badge } from "@/services/badgeService";
import { getUserRewards, UserReward } from "@/services/gamificationService";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { PatchBadge } from "@/components/gamification/PatchBadge";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { WeeklyChallenges } from "@/components/gamification/WeeklyChallenges";
import { SeasonalEvents } from "@/components/gamification/SeasonalEvents";
import { RewardsShowcase } from "@/components/gamification/RewardsShowcase";
import { CinevaultMemberCard } from "@/components/gamification/CinevaultMemberCard";
import { MemberCard3DModal } from "@/components/gamification/MemberCard3DModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Disc, Archive, Film, Globe, Clock, Users, Flame, Clapperboard, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_MAP, LORE_TERMINOLOGY } from "@/data/videoClubData";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { supabase } from "@/lib/supabase";
import type { Rarity } from "@/data/videoClubData";

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
  const { user, profile } = useAuth();
  const { currentXp, currentLevel } = useBadgeNotification();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [movieCount, setMovieCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCard3DOpen, setIsCard3DOpen] = useState(false);

  const totalUnlocked = badges.filter((b) => b.isUnlocked).length;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    if (user) {
      const [badgesData, rewardsData] = await Promise.all([
        fetchAllBadges(user.id),
        getUserRewards(user.id),
      ]);
      setBadges(badgesData);
      setUserRewards(rewardsData);

      const { count } = await supabase
        .from("physical_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setMovieCount(count || 0);
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
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container mx-auto px-4 pt-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {LORE_TERMINOLOGY.badges}
            </h1>
            <p className="text-sm font-mono text-muted-foreground">
              {totalUnlocked} débloqués • {currentXp.toLocaleString()} {LORE_TERMINOLOGY.xp}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-videoclub-cyan/10 border border-videoclub-cyan/20">
            <Trophy className="w-4 h-4 text-videoclub-cyan" />
            <span className="text-sm font-mono text-videoclub-cyan">Niv. {currentLevel}</span>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Left Column - Card + Streak */}
          {user && profile && (
            <div className="lg:col-span-4 space-y-4">
              {/* Member Card - Clickable */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => setIsCard3DOpen(true)}
              >
                <CinevaultMemberCard
                  username={profile.username || "Membre"}
                  avatarUrl={profile.avatar_url || undefined}
                  totalXp={profile.total_xp || 0}
                  movieCount={movieCount}
                  joinDate={profile.created_at || undefined}
                  equippedTitle={profile.current_title}
                  equippedFrame={profile.equipped_frame}
                  equippedTheme={profile.equipped_theme}
                  userRewards={userRewards}
                  className="w-full"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Maximize2 className="w-5 h-5 text-white" />
                    <span className="text-white font-mono text-sm">Voir en 3D</span>
                  </div>
                </div>
              </div>

              {/* Streak Display */}
              <StreakDisplay />
            </div>
          )}

          {/* Right Column - Challenges + Events */}
          {user && (
            <div className="lg:col-span-8 space-y-4">
              <WeeklyChallenges />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SeasonalEvents />
                <RewardsShowcase />
              </div>
            </div>
          )}
        </div>

        {/* Badges Section */}
        <Tabs defaultValue="collection" className="w-full">
          {/* Compact Tab Navigation */}
          <div className="mb-4 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-videoclub-surface/50 border border-white/10 p-1 h-auto rounded-xl inline-flex min-w-max">
              {BADGE_CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className={cn(
                    "rounded-lg px-3 py-2 font-mono transition-all gap-1.5 text-xs",
                    "data-[state=active]:bg-videoclub-cyan/20 data-[state=active]:text-videoclub-cyan"
                  )}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{cat.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Badge Grids */}
          {BADGE_CATEGORIES.map((cat) => (
            <TabsContent
              key={cat.id}
              value={cat.id}
              className="mt-0 focus-visible:outline-none"
            >
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

              {badges.filter((b) => b.category === cat.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-videoclub-surface border border-videoclub-cyan/20 flex items-center justify-center mb-3">
                    <cat.icon className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    Aucun écusson dans cette catégorie.
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
