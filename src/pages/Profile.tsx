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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LogOut, Edit2, Check, X, Film, Clock, Heart, UserPlus, UserMinus, Users } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { WatchedTimeline } from "@/components/WatchedTimeline";

import { FollowButton } from "@/components/FollowButton";
interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile: myProfile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies(isOwnProfile ? undefined : targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow } = useFollows(targetUserId);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(myProfile?.username || "");
  const [bio, setBio] = useState(myProfile?.bio || "");
  const [saving, setSaving] = useState(false);

  // Fetch other user's profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (isOwnProfile || !targetUserId) return;

      setLoadingProfile(true);
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", targetUserId).single();

        if (error) throw error;
        setProfileData(data);
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

  const watchedCount = userMovies.filter((m) => m.status === "watched").length;
  const watchlistCount = userMovies.filter((m) => m.status === "watchlist").length;
  const favoritesCount = userMovies.filter((m) => m.is_favorite).length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

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

  const getInitials = () => {
    if (currentProfile?.username) {
      return currentProfile.username.slice(0, 2).toUpperCase();
    }
    if (isOwnProfile && user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    return currentProfile?.username || (isOwnProfile ? user?.email?.split("@")[0] : "Utilisateur");
  };


  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="container mx-auto p-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-muted animate-pulse mb-4" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto p-4">
        {/* Two column layout on desktop */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Profile info */}
          <div className="lg:w-80 lg:sticky lg:top-20 lg:self-start">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center mb-8 lg:mb-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl md:text-3xl font-bold mb-4">
                {getInitials()}
              </div>

              {isOwnProfile && editing ? (
                <div className="w-full max-w-sm space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Pseudo</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Votre pseudo"
                      className="md:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Une courte bio..."
                      className="min-h-[80px] md:text-base"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      <Check className="w-4 h-4 mr-2" />
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-semibold">{getDisplayName()}</h2>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditing(true)}
                        className="p-2 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {currentProfile?.bio && (
                    <p className="text-muted-foreground text-center mt-2 max-w-xs md:text-base">{currentProfile.bio}</p>
                  )}

                  {/* Follow Stats */}
                  <div className="flex gap-6 mt-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{stats.followers}</p>
                      <p className="text-muted-foreground">Abonnés</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{stats.following}</p>
                      <p className="text-muted-foreground">Abonnements</p>
                    </div>
                  </div>

                  {/* Follow Button */}
                  {!isOwnProfile && user && (
                    <Button
                      onClick={toggleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? "outline" : "default"}
                      className="mt-4"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Ne plus suivre
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Suivre
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Stats - Only show for own profile */}
            {isOwnProfile && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard icon={Film} value={watchedCount} label="Films vus" />
                <StatCard icon={Clock} value={watchlistCount} label="Watchlist" />
                <StatCard icon={Heart} value={favoritesCount} label="Favoris" />
              </div>
            )}

            {/* Sign out - Only show for own profile */}
            {isOwnProfile && (
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            )}
          </div>

          {/* Right column - Content */}
          <div className="flex-1">
            {/* Top 5 Films */}
            <Top5Section topMovies={topMovies} onSetMovie={setTopMovie} editable={isOwnProfile} />

            {/* Historique des films vus - Only show for own profile */}
            {isOwnProfile && (
              <div className="mb-8">
                <h3 className="text-lg md:text-xl font-semibold mb-4">Historique des films vus</h3>
                <WatchedTimeline />
              </div>
            )}
          </div>
        </div>
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
    <div className="bg-card rounded-card p-4 text-center">
      <Icon className="w-5 h-5 mx-auto text-primary mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground md:text-sm">{label}</p>
    </div>
  );
}
