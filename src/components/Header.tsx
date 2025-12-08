import { Home, Search, Library, Trophy, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * BottomNav — Navigation mobile glassmorphism premium
 *
 * @description Barre de navigation flottante avec effet verre,
 * indicateur animé et micro-interactions.
 */

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection", showBadge: true },
  { to: "/badges", icon: Trophy, label: "Badges" },
];

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collectionCount, setCollectionCount] = useState(0);

  useEffect(() => {
    const fetchCollectionCount = async () => {
      if (!user) {
        setCollectionCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("physical_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!error && count !== null) {
        setCollectionCount(count);
      }
    };

    fetchCollectionCount();

    // Subscribe to changes
    const channel = supabase
      .channel("collection-count-bottom")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "physical_movies",
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          fetchCollectionCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Get active index for indicator position
  const activeIndex = navItems.findIndex((item) => item.to === location.pathname);

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50",
        "md:hidden",
        // Glass container
        "bg-card/80 backdrop-blur-2xl",
        "border border-white/15 dark:border-white/10",
        "rounded-2xl",
        "shadow-[0_8px_40px_rgba(0,0,0,0.12)]",
        "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]",
        // Safe area
        "safe-area-bottom",
      )}
    >
      {/* Inner container */}
      <div className="relative flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* Animated Background Indicator */}
        {activeIndex >= 0 && (
          <div
            className={cn(
              "absolute top-2 bottom-2 rounded-xl",
              "bg-primary/15 dark:bg-primary/20",
              "transition-all duration-500 ease-out",
            )}
            style={{
              width: `${100 / navItems.length - 4}%`,
              left: `${(activeIndex * 100) / navItems.length + 2}%`,
            }}
          />
        )}

        {/* Nav Items */}
        {navItems.map(({ to, icon: Icon, label, showBadge }) => {
          const isActive = location.pathname === to;

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "flex-1 py-2 z-10",
                "transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {/* Icon Container */}
              <div className={cn("relative", "transition-transform duration-300", isActive && "scale-110")}>
                <Icon className={cn("w-5 h-5", "transition-all duration-300")} strokeWidth={isActive ? 2.5 : 2} />

                {/* Badge */}
                {showBadge && collectionCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-2",
                      "min-w-[16px] h-4 px-1",
                      "flex items-center justify-center",
                      "text-[10px] font-bold",
                      "bg-primary text-primary-foreground",
                      "rounded-full",
                      "shadow-glow-sm",
                    )}
                  >
                    {collectionCount > 99 ? "99+" : collectionCount}
                  </span>
                )}

                {/* Active Glow Effect */}
                {isActive && (
                  <div
                    className={cn(
                      "absolute inset-0 -z-10",
                      "blur-lg opacity-50",
                      "bg-primary",
                      "scale-150",
                      "animate-pulse-glow",
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium",
                  "transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-70",
                )}
              >
                {label}
              </span>

              {/* Active Dot */}
              {isActive && (
                <span
                  className={cn("absolute -bottom-0.5", "w-1 h-1 rounded-full", "bg-primary", "animate-fade-in-scale")}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
