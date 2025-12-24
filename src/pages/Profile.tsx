/**
 * CineVault - Profile Page - Radical Minimalist Design
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useUserTopMovies } from "@/hooks/useUserTopMovies";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Edit2, Check, UserPlus, UserMinus, Eye, Heart, Disc, Trophy, Settings, X } from "lucide-react";
import { Top5Section } from "@/components/Top5Section";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FollowListDialog } from "@/components/FollowListDialog";
import { getPhysicalMovies } from "@/services/physicalMovies";
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

  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies(targetUserId);
  const { isFollowing, stats, loading: followLoading, toggleFollow } = useFollows(targetUserId);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !userId) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-4xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-6">Connectez-vous pour voir votre profil</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background"
          >
            Se connecter
          </Button>
        </main>
      </div>
    );
  }

  useEffect(() => {
    const loadProfile = async () => {
      if (!targetUserId) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .single();

        if (error) throw error;
        setProfileData(profile);
        setEditedUsername(profile?.username || "");
        setEditedBio(profile?.bio || "");

        const movies = await getPhysicalMovies(targetUserId);
        setPhysicalCount(movies.length);

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

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateProfile({
        username: editedUsername.trim(),
        bio: editedBio.trim(),
      });
      await refreshProfile();
      setIsEditing(false);
      toast({ title: "Profil mis à jour" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
    }
  };

  const watchedCount = userMovies.filter((m) => m.status === "watched").length;
  const favoritesCount = userMovies.filter((m) => m.is_favorite).length;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="flex gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-card" />
              <div className="flex-1 space-y-4 pt-4">
                <div className="h-6 bg-card rounded w-1/3" />
                <div className="h-4 bg-card rounded w-2/3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-4xl mx-auto text-center py-20">
          <p className="text-muted-foreground">Profil non trouvé</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
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
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt={profileData.username || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl md:text-3xl font-bold text-muted-foreground">
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
                  <input
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    placeholder="Nom d'utilisateur"
                    className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none text-xl font-bold py-2"
                  />
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Bio"
                    rows={2}
                    className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none resize-none py-2 text-muted-foreground"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-foreground text-background hover:bg-foreground/90 min-h-[44px]"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="border-border min-h-[44px]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-xl md:text-2xl font-bold">@{profileData.username}</h1>
                    {profileData.current_title && (
                      <span className="px-2 py-1 text-xs border border-border">
                        {profileData.current_title}
                      </span>
                    )}
                  </div>
                  {profileData.bio && (
                    <p className="text-muted-foreground mb-4 text-sm md:text-base">{profileData.bio}</p>
                  )}
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <button onClick={() => setFollowersOpen(true)} className="hover:text-foreground transition-colors">
                      <strong className="text-foreground">{stats.followers}</strong> abonnés
                    </button>
                    <button onClick={() => setFollowingOpen(true)} className="hover:text-foreground transition-colors">
                      <strong className="text-foreground">{stats.following}</strong> abonnements
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="border-border min-h-[44px] min-w-[44px]"
                    >
                      <Edit2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Modifier</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/settings")}
                      className="border-border min-h-[44px] min-w-[44px]"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={cn(
                      "min-h-[44px]",
                      isFollowing
                        ? "bg-transparent border border-border text-foreground hover:bg-card"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Abonné
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        S'abonner
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-12"
        >
          {[
            { icon: Disc, value: physicalCount, label: "Collection", onClick: () => navigate("/collection") },
            { icon: Eye, value: watchedCount, label: "Films vus", onClick: () => navigate("/lists") },
            { icon: Heart, value: favoritesCount, label: "Favoris", onClick: () => navigate("/lists") },
            { icon: Trophy, value: badgeCount, label: "Badges", onClick: () => navigate("/badges") },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className="bg-background p-6 text-center hover:bg-card transition-colors min-h-[100px]"
            >
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </button>
          ))}
        </motion.div>

        {/* Top 5 Movies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Top5Section
            topMovies={topMovies}
            onSetMovie={isOwnProfile ? setTopMovie : async () => ({ error: null })}
            editable={isOwnProfile}
          />
        </motion.div>
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
    </div>
  );
}
