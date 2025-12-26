/**
 * CineVault - BottomNav avec Feed/Activité intégré
 *
 * Phase 1: Navigation restructurée
 * - Accueil | Recherche | [FAB] | Feed | Collection
 * - Streak flame animée sur l'icône Collection
 * - Micro-animations au tap
 */

import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Activity, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamificationNotifications } from "@/hooks/useGamificationNotifications";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * BottomNav - Navigation mobile restructurée
 *
 * Nouvelle structure : Accueil | Recherche | [espace FAB] | Feed | Collection
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

  // Nouvelle structure de navigation : 4 items + espace central pour FAB
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
    // Espace central pour le FAB (géré dans Index.tsx)
    {
      icon: Activity,
      label: "Feed",
      path: "/feed",
      showBadge: false,
    },
    {
      icon: Library,
      label: "Collection",
      path: "/collection",
      showBadge: false,
      showStreak: true,
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
        {navItems.map((item, index) => {
          const isActive =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

          // Ajouter un espace au milieu pour le FAB
          const isAfterCenter = index >= 2;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleTap(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "w-16 h-14 rounded-xl transition-all duration-200",
                isActive ? "text-white" : "text-white/40",
                tappedItem === item.path && "scale-90",
                // Ajouter un margin pour l'espace FAB central
                index === 1 && "mr-8",
                index === 2 && "ml-8"
              )}
            >
              {/* Icon container with streak indicator */}
              <motion.div
                animate={{ scale: tappedItem === item.path ? 0.85 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative"
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive && "fill-current"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Streak flame indicator */}
                {item.showStreak && streak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5"
                  >
                    <div className="relative">
                      <Flame
                        className={cn(
                          "w-3.5 h-3.5",
                          streak >= 7
                            ? "text-orange-500"
                            : streak >= 3
                              ? "text-amber-500"
                              : "text-yellow-500"
                        )}
                        fill="currentColor"
                      />
                      {/* Pulsing glow for high streaks */}
                      {streak >= 7 && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 bg-orange-500 rounded-full blur-sm"
                        />
                      )}
                    </div>
                    {/* Streak count badge */}
                    <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-white bg-amber-600 rounded-full w-3 h-3 flex items-center justify-center">
                      {streak > 9 ? "+" : streak}
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-60"
                )}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white"
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
