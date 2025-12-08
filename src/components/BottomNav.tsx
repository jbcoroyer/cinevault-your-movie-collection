import { Home, Search, Library, Trophy } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * BottomNav - Navigation mobile avec effet glass
 *
 * Features:
 * - Glassmorphism avec blur intense
 * - Icônes avec scale au tap
 * - Badge animé sur Collection
 * - Indicateur actif avec glow
 */

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection", showBadge: true },
  { to: "/badges", icon: Trophy, label: "Badges" },
];

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
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

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "nav-glass border-t border-border/50",
        "safe-area-bottom md:hidden",
      )}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label, showBadge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center gap-1",
                "w-16 h-14 rounded-2xl",
                "transition-all duration-300",
                "active:scale-90",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Background glow for active state */}
                {isActive && (
                  <span
                    className={cn("absolute inset-1 rounded-xl", "bg-primary/10", "animate-pulse-glow")}
                    style={{ animationDuration: "3s" }}
                  />
                )}

                {/* Icon container */}
                <div className="relative z-10">
                  <Icon
                    className={cn("w-5 h-5 transition-all duration-300", isActive && "scale-110")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {/* Badge */}
                  {showBadge && collectionCount > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2.5",
                        "min-w-[16px] h-4 px-1",
                        "flex items-center justify-center",
                        "text-[10px] font-bold rounded-full",
                        "bg-primary text-primary-foreground",
                        "shadow-lg shadow-primary/30",
                      )}
                    >
                      {collectionCount > 99 ? "99+" : collectionCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-medium",
                    "transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-70",
                  )}
                >
                  {label}
                </span>

                {/* Active dot indicator */}
                {isActive && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 w-1 h-1",
                      "bg-primary rounded-full",
                      "shadow-lg shadow-primary/50",
                    )}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
