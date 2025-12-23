/**
 * CineVault - MobileHeader avec XP & Niveau
 * 
 * AMÉLIORATIONS:
 * - XP badge visible à côté du profil
 * - Ring de progression autour de l'avatar
 * - Streak flame indicator
 * - Micro-animations au tap
 */

import { useState, useEffect } from "react";
import { Disc, LogIn, User, Settings, Info, LogOut, ExternalLink, ChevronRight, Flame, Zap, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getXpProgress, getLevelFromXp, getTitleForLevel } from "@/data/videoClubData";

/**
 * XP Badge Component - Affiche le niveau et la progression
 */
const XPBadge = ({ 
  totalXp, 
  streak,
  onClick 
}: { 
  totalXp: number; 
  streak: number;
  onClick?: () => void;
}) => {
  const level = getLevelFromXp(totalXp);
  const { current, required, percentage } = getXpProgress(totalXp);
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
        "border border-amber-500/30",
        "transition-all duration-300",
        "hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
      )}
    >
      {/* Level Badge */}
      <div className="relative">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-amber-500 to-orange-600",
          "text-white text-xs font-bold"
        )}>
          {level}
        </div>
        
        {/* Progress Ring */}
        <svg 
          className="absolute -inset-0.5 w-8 h-8 -rotate-90"
          viewBox="0 0 32 32"
        >
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-500/20"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${percentage * 0.88} 88`}
            strokeLinecap="round"
            className="text-amber-500 transition-all duration-500"
          />
        </svg>
      </div>

      {/* XP Count */}
      <div className="flex items-center gap-1">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          {totalXp.toLocaleString()}
        </span>
      </div>

      {/* Streak (if active) */}
      {streak > 0 && (
        <div className="flex items-center gap-0.5 ml-1 pl-2 border-l border-amber-500/30">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-orange-500">{streak}</span>
        </div>
      )}
    </motion.button>
  );
};

/**
 * Avatar avec ring de progression
 */
const AvatarWithProgress = ({ 
  avatarUrl, 
  initials, 
  percentage,
  size = "md"
}: { 
  avatarUrl: string | null; 
  initials: string;
  percentage: number;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  const ringSize = {
    sm: 36,
    md: 44,
    lg: 52
  };

  return (
    <div className="relative">
      {/* Avatar */}
      <div className={cn(
        sizeClasses[size],
        "rounded-full overflow-hidden",
        "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
        "border-2 border-amber-500/30",
        "flex items-center justify-center"
      )}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {initials}
          </span>
        )}
      </div>

      {/* Progress Ring */}
      <svg 
        className="absolute -inset-1 -rotate-90"
        width={ringSize[size]}
        height={ringSize[size]}
        viewBox={`0 0 ${ringSize[size]} ${ringSize[size]}`}
      >
        <circle
          cx={ringSize[size] / 2}
          cy={ringSize[size] / 2}
          r={(ringSize[size] / 2) - 3}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-amber-500/20"
        />
        <circle
          cx={ringSize[size] / 2}
          cy={ringSize[size] / 2}
          r={(ringSize[size] / 2) - 3}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray={`${percentage * ((ringSize[size] - 6) * Math.PI) / 100} ${(ringSize[size] - 6) * Math.PI}`}
          strokeLinecap="round"
          className="text-amber-500 transition-all duration-500"
        />
      </svg>
    </div>
  );
};

export const MobileHeader = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Gamification data
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);

  // Fetch gamification data
  useEffect(() => {
    if (!user) return;

    const fetchGamificationData = async () => {
      // Get XP from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("id", user.id)
        .single();

      if (profileData?.total_xp) {
        setTotalXp(profileData.total_xp);
        setLevel(getLevelFromXp(profileData.total_xp));
      }

      // Get streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      if (streakData?.current_streak) {
        setStreak(streakData.current_streak);
      }
    };

    fetchGamificationData();

    // Subscribe to changes
    const channel = supabase
      .channel("mobile-header-xp")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new.total_xp) {
            setTotalXp(payload.new.total_xp);
            setLevel(getLevelFromXp(payload.new.total_xp));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await signOut();
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  const getAvatarUrl = () => {
    return profile?.avatar_url || null;
  };

  const getDisplayName = () => {
    return profile?.username || user?.email?.split("@")[0] || "Utilisateur";
  };

  const { percentage } = getXpProgress(totalXp);

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 bg-background/80 backdrop-blur-xl border-b border-border/40 flex justify-between items-center transition-all duration-300"
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20"
        >
          <Disc className="w-5 h-5 text-white" />
        </motion.div>
        <span className="font-display text-lg font-bold">
          Cine<span className="text-amber-500">Vault</span>
        </span>
      </Link>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <>
            {/* XP Badge - Visible when logged in */}
            <XPBadge 
              totalXp={totalXp} 
              streak={streak}
              onClick={() => navigate("/badges")}
            />

            {/* Profile Drawer Trigger */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <AvatarWithProgress
                    avatarUrl={getAvatarUrl()}
                    initials={getInitials()}
                    percentage={percentage}
                    size="sm"
                  />
                </motion.button>
              </DrawerTrigger>

              <DrawerContent className="max-h-[85vh]">
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader className="text-left pb-2">
                    <div className="flex items-center gap-4">
                      <AvatarWithProgress
                        avatarUrl={getAvatarUrl()}
                        initials={getInitials()}
                        percentage={percentage}
                        size="lg"
                      />
                      <div className="flex-1">
                        <DrawerTitle className="text-lg">{getDisplayName()}</DrawerTitle>
                        <DrawerDescription className="text-sm flex items-center gap-2">
                          <span className="text-amber-500 font-medium">
                            {getTitleForLevel(level)}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span>Niveau {level}</span>
                        </DrawerDescription>
                        
                        {/* XP Progress Bar */}
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {totalXp.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  </DrawerHeader>

                  <div className="p-4 pt-2">
                    {/* Stats Row */}
                    <div className="flex items-center justify-around py-3 mb-4 bg-muted/50 rounded-xl">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-lg">{streak}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Streak</span>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-lg">{totalXp.toLocaleString()}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">XP Total</span>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-lg">{level}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Niveau</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation("/profile")}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Mon profil</p>
                            <p className="text-xs text-muted-foreground">Voir et modifier</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation("/badges")}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium">Mes badges</p>
                            <p className="text-xs text-muted-foreground">Progression & récompenses</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation("/settings")}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Settings className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Paramètres</p>
                            <p className="text-xs text-muted-foreground">Compte & préférences</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </motion.button>

                      <Separator className="my-3" />

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-destructive/10 transition-colors text-left text-destructive"
                      >
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">Se déconnecter</p>
                          <p className="text-xs opacity-70">Fermer la session</p>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/auth")}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2 rounded-full px-4"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium">Connexion</span>
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MobileHeader;
