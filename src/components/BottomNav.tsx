/**
 * CineVault - BottomNav avec Streak & Animations
 * 
 * AMÉLIORATIONS:
 * - Streak flame animée sur l'icône Collection
 * - Micro-animations au tap (scale + haptic feedback simulation)
 * - Indicateur de notification amélioré
 * - Transition de page fluide
 */

import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Store, ListVideo, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamificationNotifications } from "@/hooks/useGamificationNotifications";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * BottomNav - Navigation mobile améliorée
 *
 * Structure : Accueil | Recherche | Collection (avec streak) | Marketplace | Listes
 */

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { markBadgesAsSeen, markRewardsAsSeen } = useGamificationNotifications();
  const [streak, setStreak] = useState(0);
  const [tappedItem, setTappedItem] = useState<string | null>(null);

  // Fetch streak
  useEffect(() => {
    if (!user) return;

    const fetchStreak = async () => {
      const { data } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      if (data?.current_streak) {
        setStreak(data.current_streak);
      }
    };

    fetchStreak();
  }, [user]);

  // Mark as seen when visiting badges page
  useEffect(() => {
    if (pathname === "/badges") {
      markBadgesAsSeen();
      markRewardsAsSeen();
    }
  }, [pathname, markBadgesAsSeen, markRewardsAsSeen]);

  const navItems = [
    {
      icon: Home,
      label: "Accueil",
      path: "/",
      showBadge: false,
    },
    {
      icon: Search,
      label: "Recherche",
      path: "/search",
      showBadge: false,
    },
    {
      icon: Library,
      label: "Collection",
      path: "/collection",
      showBadge: false,
      showStreak: true,
    },
    {
      icon: Store,
      label: "Marché",
      path: "/marketplace",
      showBadge: false,
    },
    {
      icon: ListVideo,
      label: "Listes",
      path: "/lists",
      showBadge: false,
    },
  ];

  const handleTap = (path: string) => {
    setTappedItem(path);
    // Simulate haptic feedback via vibration API
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setTimeout(() => setTappedItem(null), 150);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-white/10" />

      <div className="relative flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const isTapped = tappedItem === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => handleTap(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full gap-1",
                "transition-all duration-200",
                isActive ? "text-amber-500" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <motion.div
                animate={{
                  scale: isTapped ? 0.85 : 1,
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 25 
                }}
                className="relative"
              >
                {/* Icon with optional streak flame */}
                <motion.div
                  animate={{
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "fill-current"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>

                {/* Streak Flame Indicator */}
                <AnimatePresence>
                  {item.showStreak && streak > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1.5 -right-2"
                    >
                      <div className="relative">
                        <Flame 
                          className="w-3.5 h-3.5 text-orange-500 fill-orange-500" 
                        />
                        {/* Glow effect */}
                        <div className="absolute inset-0 blur-sm">
                          <Flame 
                            className="w-3.5 h-3.5 text-orange-500 fill-orange-500 opacity-60" 
                          />
                        </div>
                        {/* Streak number */}
                        {streak >= 3 && (
                          <span className="absolute -bottom-2 -right-1 text-[8px] font-bold text-orange-500 bg-background/80 rounded-full px-1">
                            {streak}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notification badge */}
                {item.showBadge && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  >
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                  </motion.span>
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 600 : 500,
                }}
                className="text-[10px] transition-all duration-200"
              >
                {item.label}
              </motion.span>

              {/* Active Indicator (top bar) */}
              <AnimatePresence>
                {isActive && (
                  <motion.span 
                    layoutId="activeTab"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute top-0 w-8 h-0.5 bg-amber-500 rounded-b-full shadow-[0_0_8px_rgba(245,158,11,0.6)]" 
                  />
                )}
              </AnimatePresence>

              {/* Tap ripple effect */}
              <AnimatePresence>
                {isTapped && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-full bg-amber-500/20"
                  />
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
