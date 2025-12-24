/**
 * CineVault — Minimal Header (Desktop + Mobile)
 * 
 * Design amélioré:
 * - Fixed header qui reste en haut
 * - Navigation visible sur desktop
 * - Logo + menu sur mobile
 * - Glassmorphism effect
 */

import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  LogIn, 
  Menu, 
  X, 
  Home, 
  Search, 
  Library, 
  Store, 
  ListVideo,
  Settings,
  Trophy,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileMenu } from "./ProfileMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/search", label: "Search", icon: Search },
  { path: "/collection", label: "Collection", icon: Library },
  { path: "/marketplace", label: "Market", icon: Store },
  { path: "/lists", label: "Lists", icon: ListVideo },
];

export const MinimalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signOut, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => 
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-white/10" />
      
      <div className="relative container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.button 
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")} 
            className="flex items-center gap-3"
          >
            <span className="font-display text-lg md:text-xl tracking-wider text-white">
              CINEVAULT
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    "text-sm font-medium transition-all duration-300",
                    active 
                      ? "bg-white text-black" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {!loading && user && (
                <ProfileMenu />
              )}

              {!loading && !user && (
                <motion.button
                  whileHover={{ opacity: 0.7 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/auth")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2",
                    "border border-white/20 rounded-full",
                    "text-sm text-white",
                    "transition-all duration-300",
                    "hover:bg-white hover:text-black"
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </motion.button>
              )}
            </div>

            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <button 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "border border-white/20 text-white",
                    "transition-all duration-300",
                    "hover:bg-white/10"
                  )}
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-full sm:w-80 p-0 bg-background/95 backdrop-blur-xl border-l border-white/10">
                <div className="flex flex-col h-full">
                  {/* Mobile menu header */}
                  <div className="p-6 border-b border-white/10">
                    {user ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-white/10 text-white">
                            {profile?.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">
                            {profile?.username || "User"}
                          </p>
                          <p className="text-sm text-white/50">
                            {profile?.username && `@${profile.username}`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="font-display text-xl text-white">Menu</h2>
                      </div>
                    )}
                  </div>

                  {/* Navigation links */}
                  <div className="flex-1 overflow-auto p-4">
                    <nav className="space-y-1">
                      {navItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        
                        return (
                          <motion.button
                            key={item.path}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigation(item.path)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 rounded-xl",
                              "transition-all duration-300",
                              active 
                                ? "bg-white text-black" 
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </motion.button>
                        );
                      })}
                    </nav>

                    {user && (
                      <>
                        <Separator className="my-4 bg-white/10" />
                        
                        <nav className="space-y-1">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigation("/profile")}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <User className="w-5 h-5" />
                              <span className="font-medium">Mon profil</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </motion.button>
                          
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigation("/badges")}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Trophy className="w-5 h-5" />
                              <span className="font-medium">Mes badges</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </motion.button>
                          
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigation("/settings")}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Settings className="w-5 h-5" />
                              <span className="font-medium">Paramètres</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </motion.button>
                        </nav>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-white/10">
                    {user ? (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Se déconnecter</span>
                      </motion.button>
                    ) : (
                      <Button
                        onClick={() => handleNavigation("/auth")}
                        className="w-full bg-white text-black hover:bg-white/90 gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
