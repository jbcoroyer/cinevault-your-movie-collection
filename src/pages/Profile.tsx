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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Edit2, Check, X, UserPlus, UserMinus } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { WatchedTimeline } from "@/components/WatchedTimeline";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";

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
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies(isOwnProfile ? undefined : targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow, refreshStats } = useFollows(targetUserId);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(myProfile?.username || "");
  const [bio, setBio] = useState(myProfile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(myProfile?.avatar_url || null);

  // État pour les dialogues d'abonnés/abonnements
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [followDialogType, setFollowDialogType] = useState<"followers" | "following">("followers");

  // Update local state when profile changes
  useEffect(() => {
    if (myProfile) {
      setUsername(myProfile.username || "");
      setBio(myProfile.bio || "");
      setAvatarUrl(myProfile.avatar_url || null);
    }
  }, [myProfile]);

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
    if (currentProfile?.username) {
      return currentProfile.username.slice(0, 2).toUpperCase();
    }
    if (isOwnProfile && user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const openFollowersDialog = () => {
    setFollowDialogType("followers");
    setFollowDialogOpen(true);
  };

  const openFollowingDialog = () => {
    setFollowDialogType("following");
    setFollowDialogOpen(true);
  };

  const handleFollowDialogClose = (open: boolean) => {
    setFollowDialogOpen(open);
    // Rafraîchir les stats quand on ferme le dialog (au cas où on se serait désabonné d'un profil)
    if (!open) {
      refreshStats();
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="container mx-auto p-4">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-muted animate-pulse mb-4" />
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

      <main className="container mx-auto p-4 max-w-4xl">
        {/* Profile Header */}
        <section className="flex flex-col items-center mb-8">
          {/* Avatar */}
          {isOwnProfile ? (
            <AvatarUpload
              currentAvatarUrl={currentAvatarUrl}
              onUploadComplete={handleAvatarUpload}
              size="lg"
              editable={true}
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold overflow-hidden">
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
          )}

          {/* Name & Edit */}
          {isOwnProfile && editing ? (
            <div className="w-full max-w-sm space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Pseudo</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre pseudo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parlez-nous de vous et de vos goûts cinématographiques..."
                  className="min-h-[100px]"
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
              <div className="flex items-center gap-2 mt-4">
                <h1 className="text-2xl font-bold">{getDisplayName()}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bio */}
              {currentProfile?.bio && (
                <p className="text-muted-foreground text-center mt-2 max-w-md">{currentProfile.bio}</p>
              )}

              {/* Follow Stats - Cliquables */}
              <div className="flex gap-6 mt-4 text-sm">
                <button
                  onClick={openFollowersDialog}
                  className="text-center hover:bg-accent rounded-lg px-3 py-2 transition-colors"
                >
                  <p className="font-semibold">{stats.followers}</p>
                  <p className="text-muted-foreground">Abonnés</p>
                </button>
                <button
                  onClick={openFollowingDialog}
                  className="text-center hover:bg-accent rounded-lg px-3 py-2 transition-colors"
                >
                  <p className="font-semibold">{stats.following}</p>
                  <p className="text-muted-foreground">Abonnements</p>
                </button>
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
        </section>

        {/* Top 5 Films */}
        <section className="mb-8">
          <Top5Section topMovies={topMovies} onSetMovie={setTopMovie} editable={isOwnProfile} />
        </section>

        {/* Historique des films vus */}
        {isOwnProfile && (
          <section className="mb-8">
            <WatchedTimeline />
          </section>
        )}
      </main>

      <BottomNav />

      {/* Dialog pour afficher les abonnés/abonnements */}
      {targetUserId && (
        <FollowListDialog
          open={followDialogOpen}
          onOpenChange={handleFollowDialogClose}
          userId={targetUserId}
          type={followDialogType}
          title={followDialogType === "followers" ? "Abonnés" : "Abonnements"}
        />
      )}
    </div>
  );
}
