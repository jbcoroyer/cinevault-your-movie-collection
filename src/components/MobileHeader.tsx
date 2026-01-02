/**
 * CineVault — Mobile Header (Unified with Desktop)
 *
 * Design monochrome minimaliste identique au desktop:
 * - Logo centré
 * - Notifications et profil à droite
 * - Même style glassmorphism
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

export const MobileHeader = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-white/5" />

      <div className="relative w-full px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left spacer for centering */}
          <div className="flex-1 flex justify-start">
            {/* Empty for balance */}
          </div>

          {/* Logo - Centered */}
          <motion.button
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="flex items-center absolute left-1/2 -translate-x-1/2"
          >
            <span className="font-display text-lg tracking-[0.15em] uppercase text-white font-light">
              CineVault
            </span>
          </motion.button>

          {/* Right section - Notifications + Profile menu */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {/* Release Notifications */}
            {!loading && user && (
              <ReleaseNotificationsPopover />
            )}

            {/* Profile Menu */}
            {!loading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center p-1 rounded-full hover:bg-white/5 transition-colors">
                    <Avatar className="w-8 h-8 border border-white/10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-white/5 text-white/70 text-sm">
                        {profile?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10">
                  {/* User info */}
                  <div className="px-3 py-2">
                    <p className="font-medium text-white">{profile?.username || "User"}</p>
                    {profile?.username && <p className="text-sm text-white/40">@{profile.username}</p>}
                  </div>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate("/following")}
                    className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Mes suivis
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate("/badges")}
                    className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Mes badges
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/5"
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
                size="sm"
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5",
                  "border border-white/20 rounded-full",
                  "text-sm text-white/80",
                  "hover:bg-white hover:text-black transition-all",
                )}
              >
                <LogIn className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;