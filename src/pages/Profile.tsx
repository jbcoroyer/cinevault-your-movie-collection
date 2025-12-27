/**
 * CineVault - Profile Page - Radical Minimalist Design
 *
 * Page de profil utilisateur avec:
 * - MinimalHeader + FloatingDock (navigation cohérente)
 * - Support profil propre ET profil d'autres utilisateurs
 * - Edition inline
 * - Stats, Top 5 et Timeline des films vus
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useUserTopMovies } from "@/hooks/useUserTopMovies";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Edit2, Check, UserPlus, UserMinus, Eye, Heart, Disc, Trophy, Settings, X, ArrowLeft } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { WatchedTimeline } from "@/components/profile/WatchedTimeline";
import { getMovieDetails } from "@/services/tmdb";
import { cn } from "@/lib/utils";

interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  total_xp?: number;
  current_title?: string;
  streaming_services?: string[];
  equipped_frame?: string | null;
  equipped_theme?: string | null;
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
  const [badgeCount, setBadgeCount] = useState(0);
  const [movieMetadata, setMovieMetadata] = useState<Record<number, { title: string; poster_path: string | null; release_year?: number }>>({});
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies(targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow } = useFollows(targetUserId);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", targetUserId).single();

        if (error) throw error;
        setProfileData(data as ProfileData);
        setEditedUsername(data?.username || "");
        setEditedBio(data?.bio || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [targetUserId]);

  // Fetch physical collection count
  useEffect(() => {
    const fetchPhysicalCount = async () => {
      if (!targetUserId) return;
      const movies = await getPhysicalMovies(targetUserId);
      setPhysicalCount(movies.length);
    };
    fetchPhysicalCount();
  }, [targetUserId]);

  // Fetch badge count
  useEffect(() => {
    const fetchBadgeCount = async () => {
      if (!targetUserId) return;
      const { count } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", targetUserId);
      setBadgeCount(count || 0);
    };
    fetchBadgeCount();
  }, [targetUserId]);

  // Fetch movie metadata for timeline
  useEffect(() => {
    const fetchMovieMetadata = async () => {
      const watchedMovies = userMovies.filter((m) => m.status === "watched");
      if (watchedMovies.length === 0) {
        setLoadingTimeline(false);
        return;
      }

      const metadata: Record<number, { title: string; poster_path: string | null; release_year?: number }> = {};
      
      // Fetch in batches to avoid too many parallel requests
      const batchSize = 10;
      for (let i = 0; i < watchedMovies.length; i += batchSize) {
        const batch = watchedMovies.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (movie) => {
            if (!metadata[movie.tmdb_id]) {
              try {
                const details = await getMovieDetails(movie.tmdb_id);
                metadata[movie.tmdb_id] = {
                  title: details.title,
                  poster_path: details.poster_path,
                  release_year: details.release_date
                    ? new Date(details.release_date).getFullYear()
                    : undefined,
                };
              } catch (e) {
                // Ignore errors for individual movies
              }
            }
          })
        );
      }
      
      setMovieMetadata(metadata);
      setLoadingTimeline(false);
    };

    fetchMovieMetadata();
  }, [userMovies]);

  const handleSaveProfile = async () => {
    if (!editedUsername.trim()) {
      toast({ title: "Erreur", description: "Le nom d'utilisateur ne peut pas être vide", variant: "destructive" });
      return;
    }

    try {
      await updateProfile({
        username: editedUsername.trim(),
        bio: editedBio.trim() || null,
      });
      await refreshProfile();
      setProfileData((prev) =>
        prev ? { ...prev, username: editedUsername.trim(), bio: editedBio.trim() || null } : null,
      );
      setIsEditing(false);
      toast({ title: "Profil mis à jour" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
    }
  };

  const watchedCount = userMovies.filter((m) => m.status === "watched").length;
  const favoritesCount = userMovies.filter((m) => m.is_favorite).length;

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 flex items-center justify-center">
          <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
        </main>
        <FloatingDock />
      </div>
    );
  }

  // Not logged in and no userId
  if (!user && !userId) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-4xl mx-auto text-center py-20">
          <p className="text-white/50 mb-6">Connectez-vous pour voir votre profil</p>
          <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90">
            Se connecter
          </Button>
        </main>
        <FloatingDock />
      </div>
    );
  }

  // Loading profile
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="flex gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5" />
              <div className="flex-1 space-y-4 pt-4">
                <div className="h-6 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  // Profile not found
  if (!profileData) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-4xl mx-auto text-center py-20">
          <p className="text-white/50 mb-4">Profil non trouvé</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-4xl mx-auto">
        {/* Back button for other users' profiles */}
        {!isOwnProfile && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </motion.button>
        )}

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isOwnProfile && isEditing ? (
                <AvatarUpload
                  currentAvatarUrl={profileData.avatar_url}
                  onUploadComplete={async (url) => {
                    await updateProfile({ avatar_url: url });
                    await refreshProfile();
                    setProfileData((prev) => (prev ? { ...prev, avatar_url: url } : null));
                  }}
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt={profileData.username || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl md:text-3xl font-bold text-white/30">
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
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Bio (optionnel)"
                    className="bg-white/5 border-white/10 text-white resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} size="sm" className="bg-white text-black hover:bg-white/90">
                      <Check className="w-4 h-4 mr-1" />
                      Enregistrer
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedUsername(profileData.username || "");
                        setEditedBio(profileData.bio || "");
                      }}
                      size="sm"
                      variant="outline"
                      className="border-white/20"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="font-display text-display-xs md:text-display-sm text-white">
                        {profileData.username?.toUpperCase() || "UTILISATEUR"}
                      </h1>
                      {profileData.current_title && (
                        <p className="text-amber-500 text-sm">{profileData.current_title}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isOwnProfile ? (
                        <>
                          <Button
                            onClick={() => setIsEditing(true)}
                            size="sm"
                            variant="outline"
                            className="border-white/20"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Modifier</span>
                          </Button>
                          <Button
                            onClick={() => navigate("/settings")}
                            size="sm"
                            variant="outline"
                            className="border-white/20"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={toggleFollow}
                          disabled={followLoading}
                          size="sm"
                          className={cn(
                            isFollowing
                              ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400"
                              : "bg-white text-black hover:bg-white/90",
                          )}
                        >
                          {isFollowing ? (
                            <>
                              <UserMinus className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Suivi</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Suivre</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {profileData.bio && <p className="text-white/50 text-sm mb-4">{profileData.bio}</p>}

                  {/* Follow stats */}
                  <div className="flex gap-4 text-sm">
                    <button
                      onClick={() => setFollowersOpen(true)}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <span className="font-semibold text-white">{stats.followers}</span> abonnés
                    </button>
                    <button
                      onClick={() => setFollowingOpen(true)}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <span className="font-semibold text-white">{stats.following}</span> abonnements
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <StatCard icon={Eye} label="Films vus" value={watchedCount} />
          <StatCard icon={Heart} label="Favoris" value={favoritesCount} />
          <StatCard icon={Disc} label="Collection" value={physicalCount} />
          <StatCard icon={Trophy} label="Badges" value={badgeCount} onClick={() => navigate("/badges")} />
        </motion.div>

        {/* Top 5 */}
        {topMovies && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
            <Top5Section
              topMovies={topMovies}
              onSetMovie={setTopMovie}
              editable={isOwnProfile}
            />
          </motion.div>
        )}

        {/* Watched Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <WatchedTimeline
            userMovies={userMovies}
            movieMetadata={movieMetadata}
            isLoading={loadingTimeline}
          />
        </motion.div>
      </main>

      {/* Follow Dialogs */}
      <FollowListDialog
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        userId={targetUserId || ""}
        type="followers"
        title="Abonnés"
      />
      <FollowListDialog
        open={followingOpen}
        onOpenChange={setFollowingOpen}
        userId={targetUserId || ""}
        type="following"
        title="Abonnements"
      />

      <FloatingDock />
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================
function StatCard({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl bg-white/5 border border-white/10",
        onClick && "hover:bg-white/10 transition-colors cursor-pointer",
      )}
    >
      <Icon className="w-5 h-5 text-white/50 mb-2" />
      <p className="font-display text-xl md:text-2xl text-white">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </Component>
  );
}
