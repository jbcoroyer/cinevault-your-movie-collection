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
import { Edit2, Check, X, UserPlus, UserMinus, Eye, Heart, Library, ListVideo, Trophy, Disc, Star } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";
import { BentoGrid, BentoCard } from "@/components/bento/BentoGrid";
// import { GlassCardStat } from "@/components/ui/GlassCard"; // On utilise un design custom maintenant
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
  const { user, profile: myProfile, updateProfile, refreshProfile, loading: authLoading } = useAuth();

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // Start true to wait for auth
  const [physicalCount, setPhysicalCount] = useState(0);

  const { userMovies } = useUserMovies();
  // Ne pas appeler useUserTopMovies si targetUserId est indéfini
  const { topMovies, setTopMovie } = useUserTopMovies(targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow, refreshStats } = useFollows(targetUserId);
  const { unlockedBadges } = useBadgeNotification();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(myProfile?.username || "");
  const [bio, setBio] = useState(myProfile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(myProfile?.avatar_url || null);

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
      setAvatarUrl(myProfile.avatar_url || null);
    }
  }, [myProfile]);

  // Handle data fetching logic
  useEffect(() => {
    const fetchProfile = async () => {
      // Attendre que l'auth soit chargée
      if (authLoading) return;

      // Si on n'a pas d'ID cible après chargement de l'auth, c'est qu'on est pas connecté et pas sur un profil public
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

        const physical = await getPhysicalMovies(targetUserId);
        setPhysicalCount(physical.length);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({ title: "Erreur", description: "Impossible de charger le profil", variant: "destructive" });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [targetUserId, isOwnProfile, authLoading]);

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

  // Stats calculation
  const watchedCount = isOwnProfile ? userMovies.filter((m) => m.status === "watched").length : 0;
  const favoritesCount = isOwnProfile ? userMovies.filter((m) => m.is_favorite).length : 0;
  const listsCount = 0; // Placeholder

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

  // Composant interne pour les stats de style "Index Community"
  const StatCardContent = ({
    count,
    label,
    description,
    icon: Icon,
  }: {
    count: number;
    label: string;
    description: string;
    icon: any;
  }) => (
    <div className="flex flex-col h-full justify-between p-1">
      <div className="flex justify-between items-start">
        <span className="text-3xl md:text-4xl font-bold font-display text-foreground tracking-tight">{count}</span>
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{label}</h3>
        <p className="text-xs text-muted-foreground/80 leading-snug line-clamp-2">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 pt-6 max-w-5xl space-y-10">
        {/* --- 1. HEADER PROFIL --- */}
        <section className="flex flex-col items-center text-center animate-fade-in pt-4">
          <div className="relative mb-5 group">
            {isOwnProfile ? (
              <div className="ring-4 ring-background shadow-2xl rounded-full">
                <AvatarUpload
                  currentAvatarUrl={currentAvatarUrl}
                  onUploadComplete={handleAvatarUpload}
                  size="lg"
                  editable={true}
                />
              </div>
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-4xl font-bold overflow-hidden ring-4 ring-background shadow-2xl">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 max-w-lg mx-auto w-full">
            {isOwnProfile && editing ? (
              <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre pseudo"
                  className="text-center font-bold text-lg bg-background"
                />
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Votre bio..."
                  className="min-h-[80px] text-center bg-background"
                />
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Check className="w-4 h-4 mr-1" /> Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
                    {getDisplayName()}
                  </h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 text-muted-foreground/50 hover:text-primary transition-all hover:bg-primary/10 rounded-full"
                      aria-label="Modifier le profil"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {currentProfile?.bio && (
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed px-4">
                    {currentProfile.bio}
                  </p>
                )}

                <div className="flex items-center justify-center gap-8 pt-2">
                  <button
                    onClick={openFollowersDialog}
                    className="group flex flex-col items-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {stats.followers}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Abonnés</span>
                  </button>
                  <div className="w-px h-8 bg-border/60" />
                  <button
                    onClick={openFollowingDialog}
                    className="group flex flex-col items-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {stats.following}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Abonnements</span>
                  </button>
                </div>

                {!isOwnProfile && user && (
                  <Button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? "outline" : "default"}
                    className="mt-4 rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
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
          </div>
        </section>

        {/* --- 2. TOP 5 FILMS (Responsive Container) --- */}
        <section className="animate-fade-in relative z-10" style={{ animationDelay: "100ms" }}>
          <Top5Section
            topMovies={topMovies}
            onSetMovie={setTopMovie}
            editable={isOwnProfile}
            compact={true} // Gère responsive via CSS interne maintenant
          />
        </section>

        {/* --- 3. BENTO GRID STATS (Nouveau Design) --- */}
        <section className="animate-fade-in pb-8" style={{ animationDelay: "200ms" }}>
          <BentoGrid cols={6} gap="md" className="auto-rows-[160px]">
            {/* Collection */}
            <BentoCard
              size="md" // Prend 2 colonnes sur desktop si configuré, ou 3 cols
              className="col-span-3 md:col-span-1 bg-gradient-to-br from-indigo-500/5 via-background to-background border-indigo-500/20 hover:border-indigo-500/40 transition-colors group"
              onClick={() => navigate(isOwnProfile ? "/collection" : "#")}
            >
              <StatCardContent
                count={physicalCount}
                label="Copies Physiques"
                description="Votre collection de DVD, Blu-ray et 4K soigneusement cataloguée."
                icon={Disc}
              />
            </BentoCard>

            {/* Films Vus */}
            <BentoCard
              size="md"
              className="col-span-3 md:col-span-1 bg-gradient-to-br from-emerald-500/5 via-background to-background border-emerald-500/20 hover:border-emerald-500/40 transition-colors group"
              onClick={() => navigate(isOwnProfile ? "/lists/watched" : "#")}
            >
              <StatCardContent
                count={watchedCount}
                label="Films Visionnés"
                description="L'historique de tous les films que vous avez regardés et notés."
                icon={Eye}
              />
            </BentoCard>

            {/* Favoris */}
            <BentoCard
              size="md"
              className="col-span-3 md:col-span-1 bg-gradient-to-br from-red-500/5 via-background to-background border-red-500/20 hover:border-red-500/40 transition-colors group"
              onClick={() => navigate(isOwnProfile ? "/lists/favorites" : "#")}
            >
              <StatCardContent
                count={favoritesCount}
                label="Coups de Cœur"
                description="Vos films préférés absolus, ceux que vous recommandez sans hésiter."
                icon={Heart}
              />
            </BentoCard>

            {/* Badges & Trophées - Half width on mobile/tablet */}
            <BentoCard
              size="sm"
              className="col-span-3 sm:col-span-1 md:col-span-1 bg-gradient-to-br from-amber-500/5 via-background to-background border-amber-500/20 hover:border-amber-500/40 transition-colors group"
              onClick={() => navigate("/badges")}
            >
              <StatCardContent
                count={unlockedBadges.length}
                label="Badges & Trophées"
                description="Récompenses débloquées via votre activité de collectionneur."
                icon={Trophy}
              />
            </BentoCard>

            {/* Listes - Half width on mobile/tablet */}
            <BentoCard
              size="sm"
              className="col-span-3 sm:col-span-1 md:col-span-1 bg-gradient-to-br from-blue-500/5 via-background to-background border-blue-500/20 hover:border-blue-500/40 transition-colors group"
              onClick={() => navigate("/lists")}
            >
              <StatCardContent
                count={listsCount}
                label="Listes Créées"
                description="Sélections thématiques pour organiser vos soirées cinéma."
                icon={ListVideo}
              />
            </BentoCard>

            {/* Avis/Critiques (Placeholder pour le moment ou redirection vers reviews) */}
            <BentoCard
              size="sm"
              className="col-span-3 sm:col-span-1 md:col-span-1 bg-gradient-to-br from-purple-500/5 via-background to-background border-purple-500/20 hover:border-purple-500/40 transition-colors group"
              onClick={() => navigate("#")}
            >
              <StatCardContent
                count={0} // À implémenter : count reviews
                label="Avis & Critiques"
                description="Vos opinions sur la qualité des films et des éditions."
                icon={Star}
              />
            </BentoCard>
          </BentoGrid>
        </section>
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
