import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useUserTopMovies } from "@/hooks/useUserTopMovies";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ProfileShowcase } from "@/components/guest/ProfileShowcase";
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
  const destinyStats = useDestinyStats(physicalMovies, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");

  // Follow list dialogs
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  // Loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Si non connecté et pas de userId dans l'URL, afficher le showcase
  if (!user && !userId) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="pt-14 md:pt-0">
          <ProfileShowcase />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!targetUserId) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        // Fetch profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .single();

        if (error) throw error;
        setProfileData(profile);
        setEditedUsername(profile?.username || "");
        setEditedBio(profile?.bio || "");

        // Fetch physical movies
        const movies = await getPhysicalMovies(targetUserId);
        setPhysicalCount(movies.length);
        setPhysicalMovies(movies);

        // Get last physical movie poster
        if (movies.length > 0) {
          const lastMovie = movies[0];
          const { getImageUrl } = await import("@/services/tmdb");
          // Fetch movie details for poster
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/${lastMovie.tmdb_id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`
          );
          const movieData = await response.json();
          setLastPhysicalPoster(getImageUrl(movieData.poster_path, "w185"));
        }

        // Fetch badge count
        const { count } = await supabase
          .from("user_badges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId);
        setBadgeCount(count || 0);

      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [targetUserId]);

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateProfile({
        username: editedUsername.trim(),
        bio: editedBio.trim(),
      });
      await refreshProfile();
      setIsEditing(false);
      toast({ title: "Profil mis à jour !" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
    }
  };

  // Calculate stats
  const watchedCount = userMovies.filter((m) => m.status === "watched").length;
  const watchlistCount = userMovies.filter((m) => m.status === "watchlist").length;
  const favoritesCount = userMovies.filter((m) => m.is_favorite).length;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="flex gap-6">
              <div className="w-32 h-32 bg-muted rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Profil non trouvé</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        <GlassCard className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isOwnProfile && isEditing ? (
                <AvatarUpload
                  currentAvatarUrl={profileData.avatar_url}
                  onUploadComplete={async (url) => {
                    await updateProfile({ avatar_url: url });
                    await refreshProfile();
                    setProfileData((prev) => prev ? { ...prev, avatar_url: url } : null);
                  }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-amber-500/20 border-4 border-amber-500/30 flex items-center justify-center overflow-hidden">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt={profileData.username || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-amber-500">
                      {(profileData.username || "U").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    placeholder="Nom d'utilisateur"
                    className="text-xl font-bold"
                  />
                  <Textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Bio"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="gap-2">
                      <Check className="w-4 h-4" />
                      Enregistrer
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">@{profileData.username}</h1>
                    {profileData.current_title && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {profileData.current_title}
                      </span>
                    )}
                  </div>
                  {profileData.bio && (
                    <p className="text-muted-foreground mb-4">{profileData.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <button onClick={() => setFollowersOpen(true)} className="hover:text-foreground">
                      <strong className="text-foreground">{stats.followers}</strong> abonnés
                    </button>
                    <button onClick={() => setFollowingOpen(true)} className="hover:text-foreground">
                      <strong className="text-foreground">{stats.following}</strong> abonnements
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {isEditing ? "Annuler" : "Modifier"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/settings")}
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Se désabonner
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      S'abonner
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Disc, value: physicalCount, label: "Collection", onClick: () => navigate("/collection") },
            { icon: Eye, value: watchedCount, label: "Films vus", onClick: () => navigate("/lists") },
            { icon: Heart, value: favoritesCount, label: "Favoris", onClick: () => navigate("/lists") },
            { icon: Trophy, value: badgeCount, label: "Badges", onClick: () => navigate("/badges") },
          ].map((stat) => (
            <GlassCard
              key={stat.label}
              className="p-4 text-center cursor-pointer hover:border-amber-500/30 transition-colors"
              onClick={stat.onClick}
            >
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </GlassCard>
          ))}
        </div>

        {/* Member Card */}
        {isOwnProfile && (
          <div className="mb-6">
            <MemberCard
              username={profileData.username || "Membre"}
              totalXp={profileData.total_xp || currentXp}
              movieCount={physicalCount}
            />
          </div>
        )}

        {/* Top 5 Movies */}
        <div className="mb-6">
          <Top5Section
            topMovies={topMovies}
            onSetMovie={isOwnProfile ? setTopMovie : async () => ({ error: null })}
            editable={isOwnProfile}
          />
        </div>
      </main>

      {/* Follow Dialogs */}
      {targetUserId && (
        <>
          <FollowListDialog
            open={followersOpen}
            onOpenChange={setFollowersOpen}
            userId={targetUserId}
            type="followers"
            title="Abonnés"
          />
          <FollowListDialog
            open={followingOpen}
            onOpenChange={setFollowingOpen}
            userId={targetUserId}
            type="following"
            title="Abonnements"
          />
        </>
      )}

      <BottomNav />
    </div>
  );
}
