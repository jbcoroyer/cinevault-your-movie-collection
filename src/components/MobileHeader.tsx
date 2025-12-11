import { useState } from "react";
import { Disc, LogIn, User, Settings, Info, LogOut, ExternalLink, ChevronRight } from "lucide-react";
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

/**
 * MobileHeader - Header mobile avec menu profil drawer
 *
 * - Logo CineVault à gauche
 * - Bouton connexion OU photo de profil à droite
 * - Clic sur la photo ouvre un drawer avec les options profil/paramètres/déconnexion
 */

export const MobileHeader = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 bg-background/80 backdrop-blur-xl border-b border-border/40 flex justify-between items-center transition-all duration-300">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Disc className="w-5 h-5 text-white animate-spin-slow" />
          <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-foreground">CineVault</span>
      </Link>

      {/* Bouton connexion (visible seulement si non connecté) */}
      {!loading && !user && (
        <Button
          size="sm"
          onClick={() => navigate("/auth")}
          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 h-8"
        >
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          Connexion
        </Button>
      )}

      {/* Avatar avec Drawer menu (si connecté) */}
      {!loading && user && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold",
                "transition-all duration-200 active:scale-95",
                "ring-2 ring-amber-500/30 hover:ring-amber-500/50",
                getAvatarUrl() ? "overflow-hidden" : "bg-amber-500/20 border border-amber-500/30 text-amber-500",
              )}
            >
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()!} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </button>
          </DrawerTrigger>

          <DrawerContent className="pb-8">
            <DrawerHeader className="text-left pb-2">
              {/* Profil header */}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0",
                    getAvatarUrl() ? "overflow-hidden" : "bg-amber-500/20 border-2 border-amber-500/30 text-amber-500",
                  )}
                >
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()!} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <DrawerTitle className="text-lg font-semibold truncate">{getDisplayName()}</DrawerTitle>
                  <DrawerDescription className="text-sm text-muted-foreground truncate">
                    {user?.email}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            <div className="px-4 py-2">
              <Separator className="mb-4" />

              {/* Menu items */}
              <div className="space-y-1">
                {/* Mon Profil */}
                <button
                  onClick={() => handleNavigation(`/profile/${user?.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Mon Profil</p>
                    <p className="text-xs text-muted-foreground">Voir et modifier mon profil</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Paramètres */}
                <button
                  onClick={() => handleNavigation("/settings")}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Paramètres</p>
                    <p className="text-xs text-muted-foreground">Préférences et compte</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                <Separator className="my-3" />

                {/* Liens externes */}
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Liens</p>

                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Twitter / X</span>
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Instagram</span>
                </a>

                <Separator className="my-3" />

                {/* À propos */}
                <button
                  onClick={() => handleNavigation("/about")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">À propos</span>
                </button>

                <Separator className="my-3" />

                {/* Déconnexion */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-destructive/10 transition-colors text-left text-destructive"
                >
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Se déconnecter</p>
                    <p className="text-xs opacity-70">Fermer la session</p>
                  </div>
                </button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};
