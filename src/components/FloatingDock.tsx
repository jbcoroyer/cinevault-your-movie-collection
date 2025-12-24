/**
 * CineVault — Floating Dock Navigation
 *
 * Design unifié mobile/desktop:
 * - Même style glassmorphism partout
 * - Floating dock centré
 * - Animations cohérentes
 * - Streak indicator
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

  // Fetch streak
  useEffect(() => {
    if (!user) return;

    const fetchStreak = async () => {
      const { data } = await supabase.from("user_streaks").select("current_streak").eq("user_id", user.id).single();

      if (data?.current_streak) {
        setStreak(data.current_streak);
      }
    };

    fetchStreak();
  }, [user]);

  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  return (
    <nav className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "flex items-center gap-1 px-2 md:px-3 py-2",
          "bg-white/10 backdrop-blur-xl",
          "border border-white/20 rounded-2xl",
          "shadow-2xl shadow-black/50",
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
                "relative flex items-center justify-center gap-2",
                "px-3 md:px-4 py-2.5 md:py-2 rounded-xl",
                "transition-all duration-300",
                active ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10",
              )}
            >
              <motion.div animate={{ scale: active ? 1 : 1 }} whileTap={{ scale: 0.9 }} className="relative">
                <Icon
                  className={cn("w-5 h-5 transition-all duration-300", active && "fill-current")}
                  strokeWidth={active ? 2 : 1.5}
                />

                {/* Streak indicator */}
                {item.showStreak && streak > 0 && user && !active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 flex items-center bg-orange-500 rounded-full px-1 py-0.5"
                  >
                    <Flame className="w-2 h-2 text-white" />
                    <span className="text-[8px] font-bold text-white ml-0.5">{streak}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Label - visible on active for desktop, hidden on mobile */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium overflow-hidden whitespace-nowrap hidden md:block"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </motion.div>

      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default FloatingDock;
