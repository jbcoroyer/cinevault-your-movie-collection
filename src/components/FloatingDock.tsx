/**
 * CineVault — Floating Dock Navigation
 * 
 * Design amélioré:
 * - Glassmorphism floating dock
 * - Minimal line icons, filled on active
 * - iOS safe area support
 * - Desktop: floating dock centered at bottom
 * - Mobile: fixed bottom bar
 */

import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Store, ListVideo, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Library, label: "Collection", path: "/collection", showStreak: true },
  { icon: Store, label: "Market", path: "/marketplace" },
  { icon: ListVideo, label: "Lists", path: "/lists" },
];

export const FloatingDock = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
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

  const isActive = (path: string) => 
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const handleTap = (path: string) => {
    setTappedItem(path);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setTimeout(() => setTappedItem(null), 150);
  };

  return (
    <>
      {/* Mobile Dock - Fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-white/10" />
        
        <div className="relative mx-4 mb-2 py-2">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              const isTapped = tappedItem === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => handleTap(item.path)}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    "min-w-[60px] min-h-[50px] rounded-xl",
                    "transition-all duration-300"
                  )}
                >
                  <motion.div
                    animate={{ 
                      scale: isTapped ? 0.9 : 1,
                      y: active ? -2 : 0
                    }}
                    transition={{ duration: 0.15 }}
                    className="relative"
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6 transition-all duration-300",
                        active 
                          ? "text-white fill-current" 
                          : "text-white/40"
                      )}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    
                    {/* Streak indicator */}
                    {item.showStreak && streak > 0 && user && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-2 flex items-center"
                      >
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-[10px] font-bold text-orange-500">
                          {streak}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>

                  <span className={cn(
                    "text-[10px] mt-1 font-medium transition-all duration-300",
                    active ? "text-white" : "text-white/40"
                  )}>
                    {item.label}
                  </span>

                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Dock - Floating centered at bottom */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "flex items-center gap-1 px-3 py-2",
            "bg-white/10 backdrop-blur-xl",
            "border border-white/20 rounded-2xl",
            "shadow-2xl shadow-black/50"
          )}
        >
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl",
                  "transition-all duration-300",
                  active 
                    ? "bg-white text-black" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    active && "fill-current"
                  )}
                  strokeWidth={active ? 2 : 1.5}
                />
                
                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Streak indicator */}
                {item.showStreak && streak > 0 && user && !active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center bg-orange-500 rounded-full px-1.5 py-0.5"
                  >
                    <Flame className="w-2.5 h-2.5 text-white" />
                    <span className="text-[9px] font-bold text-white ml-0.5">
                      {streak}
                    </span>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </motion.div>
      </nav>
    </>
  );
};

export default FloatingDock;
