import { Home, Search, Library, Trophy } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * BottomNav - Navigation mobile raccord avec Header
 * - Ligne dorée au-dessus de l'onglet actif
 * - Collection mis en avant
 */

const navItems = [
  { to: "/", icon: Home, label: "Accueil", exact: true },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection", isMain: true },
  { to: "/badges", icon: Trophy, label: "Badges" },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [collectionCount, setCollectionCount] = useState(0);

  useEffect(() => {
    if (!user) return setCollectionCount(0);

    const fetch = async () => {
      const { count } = await supabase
        .from("physical_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setCollectionCount(count || 0);
    };

    fetch();

    const channel = supabase
      .channel("bottomnav-collection")
      .on("postgres_changes", { event: "*", schema: "public", table: "physical_movies" }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom md:hidden">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map(({ to, icon: Icon, label, exact, isMain }) => {
          const active = isActive(to, exact);

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-16 h-14",
                "transition-colors active:scale-95",
              )}
            >
              {/* Indicateur actif */}
              {active && <span className="absolute top-0 left-3 right-3 h-0.5 bg-amber-500 rounded-full" />}

              {/* Icône */}
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isMain ? "text-amber-500" : active ? "text-foreground" : "text-muted-foreground",
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {isMain && collectionCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 text-[9px] font-bold rounded-full bg-amber-500 text-white flex items-center justify-center">
                    {collectionCount > 99 ? "+" : collectionCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isMain ? "text-amber-500" : active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
