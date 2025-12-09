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
import { Edit2, Check, X, UserPlus, UserMinus, Eye, Heart, Library, ListVideo, Trophy, Disc } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";
import { BentoGrid, BentoCard } from "@/components/bento/BentoGrid";
import { GlassCardStat } from "@/components/ui/GlassCard";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { getPhysicalMovies } from "@/services/physicalMovies";

interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile: myProfile, updateProfile, refreshProfile } = useAuth();

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);
  const [physicalCount, setPhysicalCount] = useState(0);

  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies(isOwnProfile ? undefined : targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow, refreshStats } = useFollows(targetUserId);
  const { unlockedBadges } = useBadgeNotification(); // Pour afficher le nombre de badges

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

  // Fetch other user's profile and collection count
  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;

      setLoadingProfile(true);
      try {
        if (!isOwnProfile) {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", targetUserId).single();
          if (error) throw error;
          setProfileData(data);
        }

        // Fetch physical count
        const physical = await getPhysicalMovies(targetUserId);
        setPhysicalCount(physical.length);
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
    if (!open) refreshStats();
  };

  // Calcul des statistiques
  // Note: userMovies contient uniquement les films de l'utilisateur connecté si on utilise le hook par défaut.
  // Il faudrait adapter useUserMovies pour accepter un userId cible, mais pour l'instant on simule avec les données dispos ou on affiche 0 pour les autres.
  // Pour une vraie implémentation multi-user, il faut que useUserMovies accepte un ID.
  const watchedCount = isOwnProfile ? userMovies.filter((m) => m.status === "watched").length : 0; // À améliorer avec fetch pour autre user
  const favoritesCount = isOwnProfile ? userMovies.filter((m) => m.is_favorite).length : 0;
  const listsCount = 0; // À implémenter avec fetch lists

  if (loadingProfile) {
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

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 pt-6 max-w-4xl space-y-8">
        {/* --- 1. HEADER PROFIL --- */}
        <section className="flex flex-col items-center text-center animate-fade-in">
          <div className="relative mb-4">
            {isOwnProfile ? (
              <AvatarUpload
                currentAvatarUrl={currentAvatarUrl}
                onUploadComplete={handleAvatarUpload}
                size="lg"
                editable={true}
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden ring-4 ring-background shadow-xl">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
            )}
          </div>

          {isOwnProfile && editing ? (
            <div className="w-full max-w-sm space-y-3 mt-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre pseudo"
                className="text-center font-bold text-lg"
              />
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Votre bio..."
                className="min-h-[80px] text-center"
              />
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Check className="w-4 h-4 mr-1" /> Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 justify-center">
                <h1 className="text-2xl sm:text-3xl font-bold font-display">{getDisplayName()}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {currentProfile?.bio && (
                <p className="text-muted-foreground mt-2 max-w-md text-sm">{currentProfile.bio}</p>
              )}

              {/* Stats Abonnés */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                <button onClick={openFollowersDialog} className="hover:text-primary transition-colors">
                  <span className="font-bold text-foreground">{stats.followers}</span> abonnés
                </button>
                <button onClick={openFollowingDialog} className="hover:text-primary transition-colors">
                  <span className="font-bold text-foreground">{stats.following}</span> abonnements
                </button>
              </div>

              {!isOwnProfile && user && (
                <Button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  variant={isFollowing ? "secondary" : "default"}
                  className="mt-5 rounded-full px-6"
                  size="sm"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Abonné
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

        {/* --- 2. TOP 5 FILMS --- */}
        <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Top5Section topMovies={topMovies} onSetMovie={setTopMovie} editable={isOwnProfile} compact={true} />
        </section>

        {/* --- 3. BENTO GRID STATS --- */}
        <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <BentoGrid cols={6} gap="sm">
            {/* Collection (Big Block) */}
            <BentoCard
              size="md"
              variant="interactive"
              className="col-span-2 sm:col-span-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20"
              onClick={() => navigate(isOwnProfile ? "/collection" : "#")} // TODO: Collection publique
            >
              <GlassCardStat
                icon={<Disc className="w-6 h-6 text-indigo-500" />}
                value={physicalCount}
                label="Collection"
                variant="primary"
              />
            </BentoCard>

            {/* Vus (Medium Block) */}
            <BentoCard
              size="sm"
              variant="interactive"
              onClick={() => navigate(isOwnProfile ? "/lists/watched" : "#")} // Utilise le filtre "watched"
            >
              <GlassCardStat
                icon={<Eye className="w-5 h-5 text-emerald-500" />}
                value={watchedCount} // Note: pour un autre user, il faudrait fetch ses stats
                label="Films vus"
              />
            </BentoCard>

            {/* Favoris (Medium Block) */}
            <BentoCard
              size="sm"
              variant="interactive"
              onClick={() => navigate(isOwnProfile ? "/lists/favorites" : "#")}
            >
              <GlassCardStat icon={<Heart className="w-5 h-5 text-red-500" />} value={favoritesCount} label="Favoris" />
            </BentoCard>

            {/* Listes (Small Block) */}
            <BentoCard size="sm" variant="interactive" onClick={() => navigate("/lists")}>
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <ListVideo className="w-6 h-6 text-blue-500 mb-1" />
                <span className="text-2xl font-bold font-display">{listsCount}</span>
                <span className="text-xs text-muted-foreground">Listes</span>
              </div>
            </BentoCard>

            {/* Badges (Small Block) */}
            <BentoCard size="sm" variant="interactive" onClick={() => navigate("/badges")}>
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <Trophy className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-2xl font-bold font-display">{unlockedBadges.length}</span>
                <span className="text-xs text-muted-foreground">Badges</span>
              </div>
            </BentoCard>
          </BentoGrid>
        </section>
      </main>

      <BottomNav />

      {/* Dialog abonnés/abonnements */}
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
