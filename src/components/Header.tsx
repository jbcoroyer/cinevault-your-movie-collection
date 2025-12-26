/**
 * CineVault - Header Desktop avec Feed intégré
 *
 * Phase 1: Navigation restructurée
 * - Feed/Activité ajouté dans la navigation
 * - XP badge visible
 * - Micro-animations au hover
 */

import { useNavigate, NavLink, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Library, Trophy, ListVideo, LogIn, Plus, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useGamificationNotifications } from "@/hooks/useGamificationNotifications";
import { NotificationCenter } from "./notifications";
import { getLevelFromXp, getXpProgress } from "@/data/videoClubData";
import { useAddMovie } from "@/contexts/AddMovieContext";

/**
 * XP Badge for Desktop Header
 */
const DesktopXPBadge = ({ totalXp, streak }: { totalXp: number; streak: number }) => {
  const level = getLevelFromXp(totalXp);
  const { percentage } = getXpProgress(totalXp);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
        "border border-amber-500/20",
        "cursor-pointer transition-all duration-300",
        "hover:border-amber-500/40 hover:shadow-md hover:shadow-amber-500/10",
      )}
    >
      {/* Level with progress ring */}
      <div className="relative">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-amber-500 to-orange-600",
            "text-white text-xs font-bold",
          )}
        >
          {level}
        </div>
        <svg className="absolute -inset-0.5 w-8 h-8 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-500/20"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${percentage} 100`}
            className="text-amber-500"
          />
        </svg>
      </div>

      {/* XP text */}
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-amber-500">{totalXp.toLocaleString()} XP</span>
        {streak > 0 && (
          <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {streak}j
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { openAddMovie } = useAddMovie();
  const [collectionCount, setCollectionCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const { hasNewBadges } = useGamificationNotifications();

  // Fetch user stats
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Collection count
      const { count } = await supabase
        .from("physical_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setCollectionCount(count || 0);

      // XP
      const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();

      setTotalXp(profile?.total_xp || 0);

      // Streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      setStreak(streakData?.current_streak || 0);
    };

    fetchStats();
  }, [user]);

  // Navigation items - Ajouter au lieu de Feed
  const navItems = [
    { to: "/", icon: Home, label: "Accueil", exact: true },
    { to: "/search", icon: Search, label: "Recherche" },
    {
      to: "/collection",
      icon: Library,
      label: "Collection",
      isMain: true,
    },
    { to: "/lists", icon: ListVideo, label: "Listes" },
    {
      to: "/badges",
      icon: Trophy,
      label: "Badges",
      hasBadge: hasNewBadges,
    },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 hidden md:block">
      <div className="container mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Logo */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 justify-self-start"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Library className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">
            Cine<span className="text-amber-500">Vault</span>
          </span>
        </motion.button>

        {/* Navigation */}
        <nav className="flex items-center justify-self-center">
          {navItems.map(({ to, icon: Icon, label, exact, isMain, hasBadge }) => {
            const active = isActive(to, exact);

            if (isMain) {
              return (
                <NavLink key={to} to={to} className="relative mx-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full",
                      "text-sm font-medium transition-all duration-300",
                      "bg-amber-500/10 border border-amber-500/30",
                      active
                        ? "bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10"
                        : "hover:bg-amber-500/15",
                    )}
                  >
                    <Icon className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">{label}</span>
                    {collectionCount > 0 && (
                      <motion.span
                        key={collectionCount}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white"
                      >
                        {collectionCount > 99 ? "99+" : collectionCount}
                      </motion.span>
                    )}
                  </motion.div>
                </NavLink>
              );
            }

            return (
              <NavLink key={to} to={to} className="relative px-4 py-3 group">
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {/* Notification badge */}
                    <AnimatePresence>
                      {hasBadge && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                        >
                          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span>{label}</span>
                </motion.div>

                {/* Active indicator */}
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="activeIndicator"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500 rounded-full"
                    />
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3 justify-self-end">
          {!loading && user && (
            <>
              {/* Add Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAddMovie}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full",
                  "bg-gradient-to-r from-amber-500 to-orange-500",
                  "hover:from-amber-600 hover:to-orange-600",
                  "text-white text-sm font-medium",
                  "shadow-lg shadow-amber-500/20",
                  "transition-all duration-300",
                )}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </motion.button>

              {/* XP Badge */}
              <Link to="/badges">
                <DesktopXPBadge totalXp={totalXp} streak={streak} />
              </Link>

              {/* Notifications */}
              <NotificationCenter />

              {/* Profile */}
              <ProfileMenu />
            </>
          )}

          {!loading && !user && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2 rounded-full"
              >
                <LogIn className="w-4 h-4" />
                Connexion
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
