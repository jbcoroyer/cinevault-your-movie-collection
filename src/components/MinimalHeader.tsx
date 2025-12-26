/**
 * CineVault — Minimal Header
 *
 * Design minimaliste cohérent avec l'UI:
 * - Logo cliquable (retour accueil)
 * - Badge niveau + streak (desktop)
 * - Menu profil à droite
 * - Glassmorphism subtil
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, User, Settings, Trophy, LogOut, ChevronDown, Flame, Sparkles } from "lucide-react";
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
  return { level, progress };
};

export const MinimalHeader = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, profile } = useAuth();
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);

  // Fetch user data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const { data: xpData } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();

      if (xpData?.total_xp) {
        setTotalXp(xpData.total_xp);
      }

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const { level, progress } = calculateLevel(totalXp);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-white/10" />

      <div className="relative container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="flex items-center"
          >
            <span className="font-display text-lg md:text-xl tracking-wider text-white">CINEVAULT</span>
          </motion.button>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Loading state */}
            {loading && <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />}

            {/* Logged in user */}
            {!loading && user && (
              <>
                {/* Level badge - Desktop only */}
                <button
                  onClick={() => navigate("/badges")}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-white/70">Niv. {level}</span>
                  <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>

                {/* Streak badge - Desktop only */}
                {streak > 0 && (
                  <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-orange-500">{streak}</span>
                  </div>
                )}

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                      <Avatar className="w-8 h-8 md:w-9 md:h-9 border border-white/20">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-white/10 text-white text-sm">
                          {profile?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-white/50 hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56 bg-zinc-900/95 backdrop-blur-xl border-white/10">
                    {/* User info */}
                    <div className="px-3 py-2">
                      <p className="font-medium text-white">{profile?.username || "Utilisateur"}</p>
                      <p className="text-xs text-white/50">Niveau {level}</p>
                    </div>

                    <DropdownMenuSeparator className="bg-white/10" />

                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer text-white/80 hover:text-white focus:text-white focus:bg-white/10"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Mon profil
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate("/badges")}
                      className="cursor-pointer text-white/80 hover:text-white focus:text-white focus:bg-white/10"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Mes badges
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="cursor-pointer text-white/80 hover:text-white focus:text-white focus:bg-white/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Paramètres
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/10" />

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Guest user */}
            {!loading && !user && (
              <Button
                onClick={() => navigate("/auth")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2",
                  "bg-white text-black hover:bg-white/90",
                  "rounded-full font-medium",
                )}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Connexion</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
