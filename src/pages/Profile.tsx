/**
 * CineVault - Profile Page - Premium Redesign
 * 
 * Page profil premium avec carte membre interactive,
 * vitrine de badges et timeline des films vus
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { 
  Edit2, Check, UserPlus, UserMinus, Eye, Heart, Disc, Trophy, 
  Settings, X, ArrowLeft, Sparkles, ChevronRight, Palette
} from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { WatchedTimeline } from "@/components/profile/WatchedTimeline";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { CinevaultMemberCard } from "@/components/gamification/CinevaultMemberCard";
import { getMovieDetails } from "@/services/tmdb";
import { isFeatureUnlocked } from "@/services/unlockablesService";
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

interface UserReward {
  reward_type: string;
  reward_id: string;
  reward_name: string;
  reward_data: any;
  is_equipped: boolean;
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
  const [hasBadgeShowcase, setHasBadgeShowcase] = useState(false);
  const [hasAnimatedAvatar, setHasAnimatedAvatar] = useState(false);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);

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

  // Fetch user rewards
  useEffect(() => {
    const fetchRewards = async () => {
      if (!targetUserId) return;
      
      const { data } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", targetUserId);
      
      if (data) {
        setUserRewards(data as UserReward[]);
      }
    };
    fetchRewards();
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

  // Check unlocked features
  useEffect(() => {
    const checkFeatures = async () => {
      if (!targetUserId) return;
      
      const [badgeShowcase, animatedAvatar] = await Promise.all([
        isFeatureUnlocked(targetUserId, "badge_showcase"),
        isFeatureUnlocked(targetUserId, "animated_avatar"),
      ]);
      
      setHasBadgeShowcase(badgeShowcase);
      setHasAnimatedAvatar(animatedAvatar);
    };
    checkFeatures();
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
                // Ignore errors
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

  // Not logged in
  if (!user && !userId) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-4xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-6">Connectez-vous pour voir votre profil</p>
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
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-2xl bg-white/5" />
            <div className="h-24 rounded-xl bg-white/5" />
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
          <p className="text-muted-foreground mb-4">Profil non trouvé</p>
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
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </motion.button>
        )}

        {/* Edit Mode */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <h3 className="text-lg font-medium text-foreground mb-4">Modifier le profil</h3>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex justify-center md:justify-start">
                  <AvatarUpload
                    currentAvatarUrl={profileData.avatar_url}
                    onUploadComplete={async (url) => {
                      await updateProfile({ avatar_url: url });
                      await refreshProfile();
                      setProfileData((prev) => (prev ? { ...prev, avatar_url: url } : null));
                    }}
                  />
                </div>
                
                {/* Fields */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Nom d'utilisateur</label>
                    <Input
                      value={editedUsername}
                      onChange={(e) => setEditedUsername(e.target.value)}
                      placeholder="Nom d'utilisateur"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Bio</label>
                    <Textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      placeholder="Décrivez-vous..."
                      className="bg-white/5 border-white/10 resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Member Card - Hero Element */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <CinevaultMemberCard
            username={profileData.username || "Utilisateur"}
            avatarUrl={profileData.avatar_url || undefined}
            totalXp={profileData.total_xp || 0}
            movieCount={watchedCount}
            joinDate={profileData.created_at}
            equippedTitle={profileData.current_title}
            equippedFrame={profileData.equipped_frame}
            equippedTheme={profileData.equipped_theme}
            userRewards={userRewards}
            className="w-full"
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {isOwnProfile ? (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex-1 md:flex-none border-white/10 bg-white/5 hover:bg-white/10"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier le profil
              </Button>
              <Button
                onClick={() => navigate("/badges")}
                variant="outline"
                className="flex-1 md:flex-none border-white/10 bg-white/5 hover:bg-white/10"
              >
                <Palette className="w-4 h-4 mr-2" />
                Personnaliser
              </Button>
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                size="icon"
                className="border-white/10 bg-white/5 hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={toggleFollow}
              disabled={followLoading}
              className={cn(
                "flex-1 md:flex-none",
                isFollowing
                  ? "bg-white/10 text-foreground hover:bg-red-500/20 hover:text-red-400"
                  : "bg-white text-black hover:bg-white/90",
              )}
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
        </motion.div>

        {/* Bio & Follow Stats */}
        {(profileData.bio || stats.followers > 0 || stats.following > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10"
          >
            {profileData.bio && (
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {profileData.bio}
              </p>
            )}
            
            <div className="flex gap-6">
              <button
                onClick={() => setFollowersOpen(true)}
                className="group flex items-center gap-2"
              >
                <span className="text-xl font-bold text-foreground">{stats.followers}</span>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  abonnés
                </span>
              </button>
              <button
                onClick={() => setFollowingOpen(true)}
                className="group flex items-center gap-2"
              >
                <span className="text-xl font-bold text-foreground">{stats.following}</span>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  abonnements
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <StatCard icon={Eye} label="Films vus" value={watchedCount} />
          <StatCard icon={Heart} label="Favoris" value={favoritesCount} />
          <StatCard icon={Disc} label="Collection" value={physicalCount} onClick={() => navigate("/collection")} />
          <StatCard icon={Trophy} label="Badges" value={badgeCount} onClick={() => navigate("/badges")} />
        </motion.div>

        {/* Badge Showcase */}
        {hasBadgeShowcase && targetUserId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <BadgeShowcase userId={targetUserId} isEditable={isOwnProfile} />
            </div>
          </motion.div>
        )}

        {/* Top 5 */}
        {topMovies.some((m) => m !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                TOP 5 FILMS
              </h2>
            </div>
            <Top5Section topMovies={topMovies} onSetMovie={setTopMovie} editable={isOwnProfile} />
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-foreground">HISTORIQUE</h2>
            <button
              onClick={() => navigate("/lists")}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Voir tout
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {loadingTimeline ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <WatchedTimeline
              userMovies={userMovies}
              movieMetadata={movieMetadata}
            />
          )}
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

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, onClick }: StatCardProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:border-white/20">
      <Icon className="w-5 h-5 text-muted-foreground mb-2" />
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );

  if (onClick) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="text-left w-full"
      >
        {content}
      </motion.button>
    );
  }

  return <div>{content}</div>;
}
