/**
 * CineVault — Minimal Header
 *
 * Design ultra-minimaliste:
 * - Logo cliquable (retour accueil)
 * - Notifications de sorties
 * - Menu profil à droite
 * - Pas de navigation (le FloatingDock s'en charge)
 * - Toujours visible sur mobile ET desktop
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, User, Settings, Trophy, LogOut, ChevronDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReleaseNotificationsPopover } from "@/components/ReleaseNotificationsPopover";

export const MinimalHeader = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-white/10" />

      <div className="relative container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo - toujours visible */}
          <motion.button
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="flex items-center"
          >
            <span className="font-display text-lg md:text-xl tracking-wider text-white">CINEVAULT</span>
          </motion.button>

          {/* Right section - Notifications + Profile menu */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Release Notifications */}
            {!loading && user && (
              <ReleaseNotificationsPopover />
            )}

            {/* Profile Menu */}
            {!loading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <Avatar className="w-8 h-8 md:w-9 md:h-9">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-white/10 text-white text-sm">
                        {profile?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-white/50 hidden md:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                  {/* User info */}
                  <div className="px-3 py-2">
                    <p className="font-medium text-white">{profile?.username || "User"}</p>
                    {profile?.username && <p className="text-sm text-white/50">@{profile.username}</p>}
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
                    onClick={() => navigate("/following")}
                    className="cursor-pointer text-white/80 hover:text-white focus:text-white focus:bg-white/10"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Mes suivis
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
            )}

            {!loading && !user && (
              <Button
                onClick={() => navigate("/auth")}
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-4 py-2",
                  "border border-white/20 rounded-full",
                  "text-sm text-white",
                  "hover:bg-white hover:text-black transition-all",
                )}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
