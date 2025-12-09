import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useUserTopMovies } from "@/hooks/useUserTopMovies";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Edit2, Check, X, UserPlus, UserMinus, Eye, Heart, ListVideo, Trophy, Disc } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";
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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [physicalCount, setPhysicalCount] = useState(0);
  const [lastPhysicalPoster, setLastPhysicalPoster] = useState<string | null>(null);
  const [lastWatchedPoster, setLastWatchedPoster] = useState<string | null>(null);
  const [lastFavoritePoster, setLastFavoritePoster] = useState<string | null>(null);

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

        // Fetch physical movies with posters from TMDB
        const physical = await getPhysicalMovies(targetUserId);
        setPhysicalCount(physical.length);
        
        // Get poster for latest physical movie
        if (physical.length > 0) {
          const latestPhysical = physical[0]; // Already sorted by created_at desc
          try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${latestPhysical.tmdb_id}?api_key=2218a5f1d1ccce0122e4be6c67cc7a90`);
            const movieData = await response.json();
            if (movieData.poster_path) {
              setLastPhysicalPoster(`https://image.tmdb.org/t/p/w154${movieData.poster_path}`);
            }
          } catch (e) {
            console.error("Error fetching physical movie poster:", e);
          }
        }

        // Fetch last watched and favorite movies
        const { data: watchedData } = await supabase
          .from("user_movies")
          .select("tmdb_id")
          .eq("user_id", targetUserId)
          .eq("status", "watched")
          .order("watched_at", { ascending: false })
          .limit(1);
        
        if (watchedData && watchedData.length > 0) {
          try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${watchedData[0].tmdb_id}?api_key=2218a5f1d1ccce0122e4be6c67cc7a90`);
            const movieData = await response.json();
            if (movieData.poster_path) {
              setLastWatchedPoster(`https://image.tmdb.org/t/p/w154${movieData.poster_path}`);
            }
          } catch (e) {
            console.error("Error fetching watched movie poster:", e);
          }
        }

        const { data: favoriteData } = await supabase
          .from("user_movies")
          .select("tmdb_id")
          .eq("user_id", targetUserId)
          .eq("is_favorite", true)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (favoriteData && favoriteData.length > 0) {
          try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${favoriteData[0].tmdb_id}?api_key=2218a5f1d1ccce0122e4be6c67cc7a90`);
            const movieData = await response.json();
            if (movieData.poster_path) {
              setLastFavoritePoster(`https://image.tmdb.org/t/p/w154${movieData.poster_path}`);
            }
          } catch (e) {
            console.error("Error fetching favorite movie poster:", e);
          }
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

  // Composant interne pour les stats - design amélioré avec preview
  const StatCardContent = ({
    count,
    label,
    icon: Icon,
    accentColor,
    posterUrl,
  }: {
    count: number;
    label: string;
    icon: any;
    accentColor: string;
    posterUrl?: string | null;
  }) => (
    <div className="flex h-full p-4">
      <div className="flex flex-col flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="mt-auto">
          <span className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight block">{count}</span>
          <h3 className="font-medium text-xs text-muted-foreground mt-0.5 truncate">{label}</h3>
        </div>
      </div>
      {posterUrl && (
        <div className="w-12 sm:w-14 flex-shrink-0 ml-2">
          <img 
            src={posterUrl} 
            alt="Dernier film" 
            className="w-full h-full object-cover rounded-lg shadow-md opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </div>
      )}
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

        {/* --- 3. BENTO GRID STATS (Nouveau Design Asymétrique) --- */}
        <section className="animate-fade-in pb-8" style={{ animationDelay: "200ms" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Collection - Grande carte avec preview */}
            <div 
              className="col-span-2 row-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-background to-background border border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(isOwnProfile ? "/collection" : "#")}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative flex h-full p-5 sm:p-6">
                <div className="flex flex-col flex-1">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Disc className="w-6 h-6" />
                  </div>
                  <div className="mt-auto">
                    <span className="text-4xl sm:text-5xl font-bold font-display text-foreground tracking-tight block">{physicalCount}</span>
                    <h3 className="font-medium text-base text-muted-foreground mt-1">Collection Physique</h3>
                    <p className="text-xs text-muted-foreground/70 mt-2 hidden sm:block">DVD, Blu-ray & 4K UHD</p>
                  </div>
                </div>
                {lastPhysicalPoster && (
                  <div className="w-20 sm:w-28 flex-shrink-0 ml-4 self-center">
                    <img 
                      src={lastPhysicalPoster} 
                      alt="Dernier ajout" 
                      className="w-full rounded-lg shadow-xl opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Films Vus avec preview */}
            <div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-background to-background border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(isOwnProfile ? "/lists/watched" : "#")}
            >
              <StatCardContent
                count={watchedCount}
                label="Films Vus"
                icon={Eye}
                accentColor="bg-emerald-500/20 text-emerald-400"
                posterUrl={lastWatchedPoster}
              />
            </div>

            {/* Favoris avec preview */}
            <div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/10 via-background to-background border border-rose-500/20 hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(isOwnProfile ? "/lists/favorites" : "#")}
            >
              <StatCardContent
                count={favoritesCount}
                label="Favoris"
                icon={Heart}
                accentColor="bg-rose-500/20 text-rose-400"
                posterUrl={lastFavoritePoster}
              />
            </div>

            {/* Badges */}
            <div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-background to-background border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate("/badges")}
            >
              <StatCardContent
                count={unlockedBadges.length}
                label="Badges"
                icon={Trophy}
                accentColor="bg-amber-500/20 text-amber-400"
              />
            </div>

            {/* Listes */}
            <div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/10 via-background to-background border border-sky-500/20 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate("/lists")}
            >
              <StatCardContent
                count={listsCount}
                label="Listes"
                icon={ListVideo}
                accentColor="bg-sky-500/20 text-sky-400"
              />
            </div>
          </div>
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
