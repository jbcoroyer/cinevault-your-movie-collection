/**
 * CineVault - Header Desktop AMÉLIORÉ
 * 
 * AMÉLIORATIONS:
 * - XP badge visible dans la navigation
 * - Micro-animations au hover
 * - Notification badge amélioré avec pulse
 * - Active indicator animé
 */

import { useNavigate, NavLink, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Search, 
  Library, 
  Trophy, 
  ListVideo, 
  LogIn, 
  Store,
  Zap,
  Flame,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useGamificationNotifications } from "@/hooks/useGamificationNotifications";
import { NotificationCenter } from "./notifications";
import { getLevelFromXp, getXpProgress } from "@/data/videoClubData";

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
        "hover:border-amber-500/40 hover:shadow-md hover:shadow-amber-500/10"
      )}
    >
      {/* Level with progress ring */}
      <div className="relative">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-amber-500 to-orange-600",
          "text-white text-xs font-bold"
        )}>
          {level}
        </div>
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

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-0.5 pl-2 border-l border-amber-500/30">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-orange-500">{streak}</span>
        </div>
      )}
    </motion.div>
  );
};

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [collectionCount, setCollectionCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const { totalNotifications, markBadgesAsSeen, markRewardsAsSeen } = useGamificationNotifications();

  // Mark as seen when visiting badges page
  useEffect(() => {
    if (location.pathname === "/badges") {
      markBadgesAsSeen();
      markRewardsAsSeen();
    }
  }, [location.pathname, markBadgesAsSeen, markRewardsAsSeen]);

  const navItems = [
    { to: "/", icon: Home, label: "Accueil", exact: true },
    { to: "/search", icon: Search, label: "Recherche" },
    { to: "/collection", icon: Library, label: "Collection", isMain: true },
    { to: "/marketplace", icon: Store, label: "Marché" },
    { to: "/lists", icon: ListVideo, label: "Listes" },
    { to: "/badges", icon: Trophy, label: "Badges", hasBadge: totalNotifications > 0 },
  ];

  // Fetch collection count and XP
  useEffect(() => {
    if (!user) {
      setCollectionCount(0);
      setTotalXp(0);
      setStreak(0);
      return;
    }

    const fetchData = async () => {
      // Collection count
      const { count } = await supabase
        .from("physical_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setCollectionCount(count || 0);

      // XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("id", user.id)
        .single();
      if (profile?.total_xp) {
        setTotalXp(profile.total_xp);
      }

      // Streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();
      if (streakData?.current_streak) {
        setStreak(streakData.current_streak);
      }
    };

    fetchData();

    // Subscribe to changes
    const channel = supabase
      .channel("header-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "physical_movies" },
        fetchData
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new.total_xp) {
            setTotalXp(payload.new.total_xp);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 hidden md:block">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")} 
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Library className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">
            Cine<span className="text-amber-500">Vault</span>
          </span>
        </motion.button>

        {/* Navigation */}
        <nav className="flex items-center">
          {navItems.map(({ to, icon: Icon, label, exact, isMain, hasBadge }) => {
            const active = isActive(to, exact);

            if (isMain) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative mx-2"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full",
                      "text-sm font-medium transition-all duration-300",
                      "bg-amber-500/10 border border-amber-500/30",
                      active 
                        ? "bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10" 
                        : "hover:bg-amber-500/15"
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
              <NavLink
                key={to}
                to={to}
                className="relative"
              >
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2",
                    "text-sm font-medium transition-colors duration-200",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500 rounded-full" 
                    />
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {!loading && user && (
            <>
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
