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
import { Edit2, Check, UserPlus, UserMinus } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { FollowListDialog } from "@/components/FollowListDialog";
import { ProfileBento } from "@/components/bento/ProfileBento";

interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile: myProfile, updateProfile, loading: authLoading } = useAuth();

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Stats pour followers/following
  const { isFollowing, stats, loading: followLoading, toggleFollow } = useFollows(targetUserId);

  // Top 5 Films
  const { topMovies, setTopMovie } = useUserTopMovies(targetUserId);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(myProfile?.username || "");
  const [bio, setBio] = useState(myProfile?.bio || "");
  const [saving, setSaving] = useState(false);

  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [followDialogType, setFollowDialogType] = useState<"followers" | "following">("followers");

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
  };

  // Sync state with profile
  useEffect(() => {
    if (myProfile) {
      setUsername(myProfile.username || "");
      setBio(myProfile.bio || "");
    }
  }, [myProfile]);

  // Handle data fetching logic
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
          const { data, error } = await supabase.from("profiles").select("*").eq("id", targetUserId).single();
          if (error) throw error;
          setProfileData(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({ title: "Erreur", description: "Impossible de charger le profil", variant: "destructive" });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [targetUserId, isOwnProfile, authLoading]);

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

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="container mx-auto p-4 flex justify-center pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Fallback if not logged in and trying to view own profile
  if (isOwnProfile && !user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
          <h2 className="text-xl font-bold">Connexion requise</h2>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à votre profil.</p>
          <Button onClick={() => navigate("/auth")}>Se connecter</Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 pt-6 max-w-6xl space-y-8">
        {/* --- 1. MODE ÉDITION (Restreint aux champs texte simples si besoin, sinon géré dans le Bento ou Settings) --- */}
        {isOwnProfile && editing && (
          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Éditer le profil
            </h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium mb-1 block">Pseudo</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Votre pseudo" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Biographie</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Votre bio..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Check className="w-4 h-4 mr-1" /> Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
                  Annuler
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* --- 2. BENTO GRID (Profile, Stats, Highlights) --- */}
        {targetUserId && <ProfileBento userId={targetUserId} isOwnProfile={isOwnProfile} />}

        {/* --- 3. ACTIONS SOCIALES & TOP 5 --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne Gauche : Top 5 */}
          <div className="lg:col-span-2 space-y-6">
            <Top5Section topMovies={topMovies} onSetMovie={setTopMovie} editable={isOwnProfile} />
          </div>

          {/* Colonne Droite : Abonnements et Actions */}
          <div className="space-y-6">
            {/* Carte Sociale */}
            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h3 className="font-bold text-lg mb-4 font-display">Communauté</h3>
              <div className="flex items-center justify-around">
                <button
                  onClick={openFollowersDialog}
                  className="group flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stats.followers}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Abonnés</span>
                </button>
                <div className="w-px h-10 bg-border" />
                <button
                  onClick={openFollowingDialog}
                  className="group flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stats.following}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Abonnements</span>
                </button>
              </div>

              {!isOwnProfile && user && (
                <Button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="w-full mt-6 shadow-lg shadow-primary/10"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Se désabonner
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Suivre
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Edit Trigger si pas en mode édition */}
            {isOwnProfile && !editing && (
              <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier mes infos
              </Button>
            )}
          </div>
        </div>
      </main>

      <BottomNav />

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
