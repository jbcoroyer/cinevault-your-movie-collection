import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useUserTopMovies } from "@/hooks/useUserTopMovies";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Edit2, Check, UserPlus, UserMinus, Eye, Heart, ListVideo, Trophy, Disc, Settings } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";
import { MemberCard, DestinyMatrix, useDestinyStats } from "@/components/gamification";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { GlassCard } from "@/components/ui/GlassCard";
import { LORE_TERMINOLOGY } from "@/data/videoClubData";

interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  total_xp?: number;
  current_title?: string;
  streaming_services?: string[];
}

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile: myProfile, updateProfile, loading: authLoading, refreshProfile } = useAuth();

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [physicalCount, setPhysicalCount] = useState(0);
  const [physicalMovies, setPhysicalMovies] = useState<any[]>([]);
  const [lastPhysicalPoster, setLastPhysicalPoster] = useState<string | null>(null);
  const [lastWatchedPoster, setLastWatchedPoster] = useState<string | null>(null);
  const [lastFavoritePoster, setLastFavoritePoster] = useState<string | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);

  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies(targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow } = useFollows(targetUserId);
  const { currentLevel, currentXp } = useBadgeNotification();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [followDialogType, setFollowDialogType] = useState<"followers" | "following">("followers");

  // Destiny stats
  const destinyStats = useDestinyStats(physicalMovies, []);

  // Sync state
  useEffect(() => {
    if (myProfile && isOwnProfile) {
      setUsername(myProfile.username || "");
      setBio(myProfile.bio || "");
      setAvatarUrl(myProfile.avatar_url || null);
    } else if (profileData && !isOwnProfile) {
      setAvatarUrl(profileData.avatar_url || null);
    }
  }, [myProfile, profileData, isOwnProfile]);

  // Fetch logic
  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;
      if (!targetUserId) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        if (!isOwnProfile) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", targetUserId)
            .single();
          if (error) throw error;
          setProfileData(data);
        }

        const physical = await getPhysicalMovies(targetUserId);
        setPhysicalMovies(physical);
        setPhysicalCount(physical.length);

        // Badge count
        const { count } = await supabase
          .from("user_badges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId);
        setBadgeCount(count || 0);

        // Posters fetching logic
        const fetchPoster = async (tmdbId: number) => {
          try {
            const res = await fetch(
              `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=2218a5f1d1ccce0122e4be6c67cc7a90`,
            );
            const data = await res.json();
            return data.poster_path ? `https://image.tmdb.org/t/p/w154${data.poster_path}` : null;
          } catch {
            return null;
          }
        };

        if (physical.length > 0) setLastPhysicalPoster(await fetchPoster(physical[0].tmdb_id));

        const { data: watchedData } = await supabase
          .from("user_movies")
          .select("tmdb_id")
          .eq("user_id", targetUserId)
          .eq("status", "watched")
          .order("watched_at", { ascending: false })
          .limit(1);
        if (watchedData?.[0]) setLastWatchedPoster(await fetchPoster(watchedData[0].tmdb_id));

        const { data: favoriteData } = await supabase
          .from("user_movies")
          .select("tmdb_id")
          .eq("user_id", targetUserId)
          .eq("is_favorite", true)
          .order("created_at", { ascending: false })
          .limit(1);
        if (favoriteData?.[0]) setLastFavoritePoster(await fetchPoster(favoriteData[0].tmdb_id));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [targetUserId, isOwnProfile, authLoading]);

  const currentProfile = isOwnProfile ? myProfile : profileData;
  const currentAvatarUrl = isOwnProfile ? avatarUrl : profileData?.avatar_url;
  const totalXp = isOwnProfile ? currentXp : (profileData?.total_xp || 0);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ username, bio });
    if (!error) {
      toast({ title: "Profil mis à jour" });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleAvatarUpload = (newUrl: string) => {
    setAvatarUrl(newUrl);
    refreshProfile();
  };

  const getDisplayName = () => currentProfile?.username || (isOwnProfile ? user?.email?.split("@")[0] : LORE_TERMINOLOGY.user);

  // Stats
  const watchedCount = isOwnProfile ? userMovies.filter((m) => m.status === "watched").length : 0;
  const favoritesCount = isOwnProfile ? userMovies.filter((m) => m.is_favorite).length : 0;

  if (authLoading || loadingProfile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 pt-20 max-w-6xl space-y-12">
        {/* --- SECTION HÉROS --- */}
        <section className="relative">
          {/* Background décoratif néon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[400px] bg-gradient-to-b from-videoclub-cyan/5 via-background to-background -z-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            {/* Colonne Gauche: Avatar & Infos */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-1 text-center md:text-left w-full">
              <div className="relative group">
                <AvatarUpload
                  currentAvatarUrl={currentAvatarUrl}
                  onUploadComplete={handleAvatarUpload}
                  size="xl"
                  editable={isOwnProfile}
                  userId={targetUserId}
                  username={currentProfile?.username || ""}
                />
                {isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 shadow-md border border-videoclub-cyan/30">
                    <Settings className="w-5 h-5 text-videoclub-cyan" />
                  </div>
                )}
              </div>

              <div className="space-y-3 max-w-md">
                {isOwnProfile && editing ? (
                  <div className="space-y-3 bg-videoclub-surface p-4 rounded-2xl border border-videoclub-cyan/20 animate-in fade-in slide-in-from-left-4">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Pseudo"
                      className="font-bold text-lg bg-background/50"
                    />
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Votre bio..."
                      className="bg-background/50 h-20 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        <Check className="w-4 h-4 mr-1" /> Sauvegarder
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <h1 className="text-4xl font-bold font-display tracking-tight">{getDisplayName()}</h1>
                        {isOwnProfile && (
                          <button
                            onClick={() => setEditing(true)}
                            className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground/50 hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2 leading-relaxed">
                        {currentProfile?.bio || "Pas de bio renseignée."}
                      </p>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-6 pt-1">
                      <button
                        onClick={() => {
                          setFollowDialogType("followers");
                          setFollowDialogOpen(true);
                        }}
                        className="flex items-baseline gap-1.5 group"
                      >
                        <span className="text-xl font-bold text-foreground group-hover:text-videoclub-cyan transition-colors">
                          {stats.followers}
                        </span>
                        <span className="text-sm text-muted-foreground">Abonnés</span>
                      </button>
                      <button
                        onClick={() => {
                          setFollowDialogType("following");
                          setFollowDialogOpen(true);
                        }}
                        className="flex items-baseline gap-1.5 group"
                      >
                        <span className="text-xl font-bold text-foreground group-hover:text-videoclub-cyan transition-colors">
                          {stats.following}
                        </span>
                        <span className="text-sm text-muted-foreground">Abonnements</span>
                      </button>
                    </div>

                    {!isOwnProfile && user && (
                      <Button
                        onClick={toggleFollow}
                        disabled={followLoading}
                        variant={isFollowing ? "secondary" : "default"}
                        className="rounded-full px-6"
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" /> Abonné
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" /> Suivre
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Colonne Droite: CARTE DE MEMBRE */}
            <div className="w-full md:w-auto flex justify-center md:justify-end animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
              <div className="w-full max-w-sm md:w-[360px]">
                <MemberCard
                  username={getDisplayName()}
                  avatarUrl={currentAvatarUrl || undefined}
                  totalXp={totalXp}
                  movieCount={physicalCount}
                  joinDate={currentProfile?.created_at}
                  className="shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- DESTINY MATRIX --- */}
        {isOwnProfile && physicalCount > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <h2 className="text-xl font-display font-bold mb-6 text-center">
              <span className="text-videoclub-cyan">Votre</span> Destinée
            </h2>
            <div className="max-w-md mx-auto">
              <DestinyMatrix stats={destinyStats} />
            </div>
          </section>
        )}

        {/* --- STATS GRID --- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          {/* Carte Inventaire (Collection) */}
          <div
            onClick={() => navigate(isOwnProfile ? "/collection" : "#")}
            className="col-span-2 row-span-2 group cursor-pointer"
          >
            <GlassCard className="h-full p-0 overflow-hidden relative border-videoclub-cyan/20 hover:border-videoclub-cyan/50 transition-colors">
              <div className="absolute inset-0 bg-videoclub-cyan/5 group-hover:bg-videoclub-cyan/10 transition-colors" />
              <div className="p-6 h-full flex flex-col relative z-10">
                <div className="w-12 h-12 rounded-xl bg-videoclub-cyan/20 text-videoclub-cyan flex items-center justify-center mb-4">
                  <Disc className="w-6 h-6" />
                </div>
                <div className="mt-auto">
                  <span className="text-5xl font-bold font-display text-foreground">{physicalCount}</span>
                  <p className="text-videoclub-cyan/80 font-medium mt-1">{LORE_TERMINOLOGY.collection}</p>
                </div>
              </div>
              {lastPhysicalPoster && (
                <img
                  src={lastPhysicalPoster}
                  className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 mask-image-linear-to-l group-hover:scale-110 transition-transform duration-700"
                  alt="background"
                />
              )}
            </GlassCard>
          </div>

          {/* Carte Vus */}
          <div onClick={() => navigate(isOwnProfile ? "/lists/watched" : "#")} className="group cursor-pointer">
            <GlassCard className="h-full relative overflow-hidden border-emerald-500/20 hover:border-emerald-500/50">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-bold font-display">{watchedCount}</span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">Films Vus</p>
              </div>
            </GlassCard>
          </div>

          {/* Carte Favoris */}
          <div onClick={() => navigate(isOwnProfile ? "/lists/favorites" : "#")} className="group cursor-pointer">
            <GlassCard className="h-full relative overflow-hidden border-rose-500/20 hover:border-rose-500/50">
              <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-bold font-display">{favoritesCount}</span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">Favoris</p>
              </div>
            </GlassCard>
          </div>

          {/* Carte Écussons (Badges) */}
          <div onClick={() => navigate("/badges")} className="group cursor-pointer">
            <GlassCard className="h-full relative overflow-hidden border-videoclub-magenta/20 hover:border-videoclub-magenta/50">
              <div className="absolute inset-0 bg-videoclub-magenta/5 group-hover:bg-videoclub-magenta/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-videoclub-magenta/20 rounded-lg text-videoclub-magenta">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-bold font-display">{badgeCount}</span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{LORE_TERMINOLOGY.badges}</p>
              </div>
            </GlassCard>
          </div>

          {/* Carte Listes */}
          <div onClick={() => navigate("/lists")} className="group cursor-pointer">
            <GlassCard className="h-full relative overflow-hidden border-sky-500/20 hover:border-sky-500/50">
              <div className="absolute inset-0 bg-sky-500/5 group-hover:bg-sky-500/10 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
                    <ListVideo className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">Listes</p>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* --- TOP 5 SECTION --- */}
        <Top5Section
          topMovies={topMovies}
          onSetMovie={setTopMovie}
        />
      </main>

      <BottomNav />

      <FollowListDialog
        open={followDialogOpen}
        onOpenChange={setFollowDialogOpen}
        type={followDialogType}
        userId={targetUserId!}
        title={followDialogType === "followers" ? "Abonnés" : "Abonnements"}
      />
    </div>
  );
}
