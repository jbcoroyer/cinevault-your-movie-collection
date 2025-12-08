import { Home, Search, Library, Trophy } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

    // Subscribe to changes
    const channel = supabase
      .channel("collection-count")
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, showBadge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-button transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon
                    className={cn("w-5 h-5 transition-all duration-200", isActive && "scale-110")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {showBadge && collectionCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {collectionCount > 99 ? "99+" : collectionCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
