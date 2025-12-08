import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { Edit2, Check, X, UserPlus, UserMinus, Film, Heart, Clock } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { WatchedTimeline } from "@/components/WatchedTimeline";
import { AvatarUpload } from "@/components/AvatarUpload";

interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile: myProfile, updateProfile, refreshProfile } = useAuth();

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  // Stats pour les profils visités
  const [profileStats, setProfileStats] = useState({ watched: 0, watchlist: 0, favorites: 0 });
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies(isOwnProfile ? undefined : targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow } = useFollows(targetUserId);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(myProfile?.username || "");
  const [bio, setBio] = useState(myProfile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(myProfile?.avatar_url || null);

  // Stats : Si c'est mon profil, j'utilise mes données locales, sinon j'utilise celles fetchées
  const watchedCount = isOwnProfile ? userMovies.filter((m) => m.status === "watched").length : profileStats.watched;

  const watchlistCount = isOwnProfile
    ? userMovies.filter((m) => m.status === "watchlist").length
    : profileStats.watchlist;

  const favoritesCount = isOwnProfile ? userMovies.filter((m) => m.is_favorite).length : profileStats.favorites;

  useEffect(() => {
    if (myProfile) {
      setUsername(myProfile.username || "");
      setBio(myProfile.bio || "");
      setAvatarUrl(myProfile.avatar_url || null);
    }
  }, [myProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isOwnProfile || !targetUserId) return;

      setLoadingProfile(true);
      try {
        // Fetch Profile Info
        const { data, error } = await supabase.from("profiles").select("*").eq("id", targetUserId).single();
        if (error) throw error;
        setProfileData(data);

        // Fetch Stats for visited profile
        const { count: watched } = await supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId)
          .eq("status", "watched");

        const { count: watchlist } = await supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId)
          .eq("status", "watchlist");

        const { count: favorites } = await supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", targetUserId)
          .eq("is_favorite", true);

        setProfileStats({
          watched: watched || 0,
          watchlist: watchlist || 0,
          favorites: favorites || 0,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({ title: "Erreur", description: "Profil introuvable", variant: "destructive" });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [targetUserId, isOwnProfile]);

  const currentProfile = isOwnProfile ? myProfile : profileData;
  const currentAvatarUrl = isOwnProfile ? avatarUrl : profileData?.avatar_url;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ username, bio });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour" });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setUsername(myProfile?.username || "");
    setBio(myProfile?.bio || "");
    setEditing(false);
  };

  const handleAvatarUpload = (newUrl: string) => {
    setAvatarUrl(newUrl);
    refreshProfile();
  };

  const getDisplayName = () => {
    return currentProfile?.username || (isOwnProfile ? user?.email?.split("@")[0] : "Utilisateur");
  };

  const getInitials = () => {
    if (currentProfile?.username) return currentProfile.username.slice(0, 2).toUpperCase();
    if (isOwnProfile && user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <main className="container mx-auto p-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted animate-pulse mb-4" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Profile Header */}
        <section className="flex flex-col items-center mb-6 sm:mb-8">
          {/* Avatar */}
          {isOwnProfile ? (
            <AvatarUpload
              currentAvatarUrl={currentAvatarUrl}
              onUploadComplete={handleAvatarUpload}
              size="lg"
              editable={true}
            />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl sm:text-3xl font-bold overflow-hidden">
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
          )}

          {/* Nom & Edit */}
          {isOwnProfile && editing ? (
            <div className="mt-4 w-full max-w-xs space-y-3">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Pseudo"
                className="text-center"
              />
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio (optionnel)"
                className="text-center resize-none"
                rows={2}
              />
              <div className="flex gap-2 justify-center">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  <Check className="w-4 h-4 mr-1" />
                  {saving ? "..." : "Enregistrer"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={saving} size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">{getDisplayName()}</h2>
                {isOwnProfile && (
                  <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="h-8 w-8">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {currentProfile?.bio && (
                <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">{currentProfile.bio}</p>
              )}

              {/* Follow button for other profiles */}
              {!isOwnProfile && (
                <Button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="mt-3"
                  size="sm"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-1" />
                      Ne plus suivre
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Suivre
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Stats - Affiché pour tout le monde maintenant */}
        <section className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <StatCard icon={Film} value={watchedCount} label="Vus" />
          <StatCard icon={Clock} value={watchlistCount} label="Watchlist" />
          <StatCard icon={Heart} value={favoritesCount} label="Favoris" />
        </section>

        {/* Top 5 */}
        <Top5Section
          topMovies={topMovies}
          onSetMovie={isOwnProfile ? setTopMovie : undefined}
          editable={isOwnProfile}
        />

        {/* Timeline */}
        {isOwnProfile && <WatchedTimeline />}
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-card rounded-xl p-3 sm:p-4 text-center border">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-primary mb-1 sm:mb-2" />
      <p className="text-lg sm:text-2xl font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
