/**
 * CineVault — Premium Header
 *
 * Design premium et élégant:
 * - Logo avec icône animée
 * - Glassmorphism subtil
 * - Menu profil avec XP et niveau
 * - Animations fluides
 * - Responsive mobile/desktop
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, User, Settings, Trophy, LogOut, Sparkles, Flame, ChevronDown, Bell, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// XP level calculation
const calculateLevel = (xp: number) => {
  const level = Math.floor(xp / 1000) + 1;
  const currentLevelXp = xp % 1000;
  const progress = (currentLevelXp / 1000) * 100;
  return { level, currentLevelXp, progress };
};

// Level titles
const getLevelTitle = (level: number): string => {
  if (level >= 50) return "Légende du Cinéma";
  if (level >= 40) return "Maître Projectionniste";
  if (level >= 30) return "Archiviste Expert";
  if (level >= 20) return "Collectionneur Pro";
  if (level >= 15) return "Cinéphile Passionné";
  if (level >= 10) return "Amateur Éclairé";
  if (level >= 5) return "Novice Curieux";
  return "Nouveau Membre";
};

export const MinimalHeader = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, profile } = useAuth();
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch user XP and streak
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      // Fetch XP
      const { data: xpData } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();

      if (xpData?.total_xp) {
        setTotalXp(xpData.total_xp);
      }

      // Fetch streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      if (streakData?.current_streak) {
        setStreak(streakData.current_streak);
      }
    };

    fetchUserData();
  }, [user]);

  // Handle scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const { level, progress } = calculateLevel(totalXp);
  const levelTitle = getLevelTitle(level);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Background with enhanced glassmorphism */}
      <motion.div
        initial={false}
        animate={{
          backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.4)",
          backdropFilter: isScrolled ? "blur(20px)" : "blur(12px)",
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 border-b border-white/10"
      />

      <div className="relative container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo Section */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            {/* Animated icon */}
            <div className="relative">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Film className="w-5 h-5 text-white" />
              </motion.div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Logo text */}
            <div className="flex flex-col">
              <span className="font-display text-xl md:text-2xl font-bold tracking-tight">
                <span className="text-white">Cine</span>
                <span className="text-amber-500">Vault</span>
              </span>
              <span className="text-[10px] text-white/40 tracking-widest uppercase hidden md:block">
                Collection Premium
              </span>
            </div>
          </motion.button>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Loading state */}
            {loading && <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />}

            {/* Logged in user */}
            {!loading && user && (
              <>
                {/* XP Badge - Desktop only */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/badges")}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-500">Niv. {level}</span>

                  {/* Mini progress bar */}
                  <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                  </div>
                </motion.button>

                {/* Streak badge - if active */}
                {streak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30"
                  >
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-500">{streak}</span>
                  </motion.div>
                )}

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 p-1 pr-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <Avatar className="w-8 h-8 border-2 border-amber-500/50">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm font-bold">
                          {profile?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-white/50" />
                    </motion.button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-72 p-0 bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl overflow-hidden"
                  >
                    {/* User header */}
                    <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-amber-500/50">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold">
                            {profile?.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{profile?.username || "Utilisateur"}</p>
                          <p className="text-sm text-amber-500/80">{levelTitle}</p>
                        </div>
                      </div>

                      {/* XP Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-white/50">Niveau {level}</span>
                          <span className="text-white/50">{totalXp} XP</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <DropdownMenuItem
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-white/80 hover:text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">Mon profil</p>
                          <p className="text-xs text-white/40">Voir et éditer mon profil</p>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate("/badges")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-white/80 hover:text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium">Mes badges</p>
                          <p className="text-xs text-white/40">Progression et récompenses</p>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate("/settings")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-white/80 hover:text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">Paramètres</p>
                          <p className="text-xs text-white/40">Préférences du compte</p>
                        </div>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-white/10 m-0" />

                    <div className="p-2">
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Se déconnecter</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Guest user */}
            {!loading && !user && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigate("/auth")}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5",
                    "bg-gradient-to-r from-amber-500 to-orange-500",
                    "hover:from-amber-400 hover:to-orange-400",
                    "text-white font-semibold rounded-full",
                    "shadow-lg shadow-amber-500/25",
                    "transition-all duration-300",
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Connexion</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
