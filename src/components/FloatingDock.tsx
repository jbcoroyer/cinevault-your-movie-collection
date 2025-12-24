/**
 * CineVault — Floating Dock Navigation
 * 
 * Radical Minimalist design:
 * - Glassmorphism floating dock
 * - Minimal line icons, filled on active
 * - iOS safe area support
 * - Responsive: fixed bottom on mobile, floating on desktop
 */

import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Store, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Library, label: "Collection", path: "/collection" },
  { icon: Store, label: "Market", path: "/marketplace" },
  { icon: ListVideo, label: "Lists", path: "/lists" },
];

export const FloatingDock = () => {
  const { pathname } = useLocation();

  const isActive = (path: string) => 
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <>
      {/* Mobile Dock - Fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
        <div className="mx-4 mb-2">
          <div className="glass-heavy rounded-2xl px-2 py-3">
            <div className="flex justify-around items-center">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative flex flex-col items-center justify-center",
                      "min-w-[44px] min-h-[44px] rounded-xl",
                      "transition-all duration-300",
                      active ? "text-white" : "text-white/40 hover:text-white/70"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-300",
                        active && "fill-current"
                      )}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    
                    {/* Active indicator dot */}
                    {active && (
                      <motion.div
                        layoutId="dock-indicator-mobile"
                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Dock - Floating center bottom */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="glass-heavy rounded-full px-2 py-2"
        >
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center justify-center",
                    "w-12 h-12 rounded-full",
                    "transition-all duration-300",
                    active 
                      ? "bg-white text-black" 
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      active && "fill-current"
                    )}
                    strokeWidth={active ? 2 : 1.5}
                  />
                </Link>
              );
            })}
          </div>
        </motion.div>
      </nav>
    </>
  );
};

export default FloatingDock;
