import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { Home, Search, Library, Trophy, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileMenu from "./ProfileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Header - Navigation desktop épurée
 * - Ligne dorée sous l'onglet actif
 * - Collection mis en avant avec fond ambre
 */

const navItems = [
  { to: "/", icon: Home, label: "Accueil", exact: true },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection", isMain: true },
  { to: "/lists", icon: ListVideo, label: "Listes" },
  { to: "/badges", icon: Trophy, label: "Badges" },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
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
      .channel("header-collection")
      .on("postgres_changes", { event: "*", schema: "public", table: "physical_movies" }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border hidden md:block">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Library className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">
            Cine<span className="text-amber-500">Vault</span>
          </span>
        </button>

        {/* Nav */}
        <nav className="flex items-center">
          {navItems.map(({ to, icon: Icon, label, exact, isMain }) => {
            const active = isActive(to, exact);

            if (isMain) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex items-center gap-2 mx-2 px-4 py-1.5 rounded-full",
                    "text-sm font-medium transition-all",
                    "bg-amber-500/10 border border-amber-500/30",
                    active ? "bg-amber-500/20 border-amber-500/50" : "hover:bg-amber-500/15",
                  )}
                >
                  <Icon className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">{label}</span>
                  {collectionCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                      {collectionCount > 99 ? "99+" : collectionCount}
                    </span>
                  )}
                </NavLink>
              );
            }

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2",
                  "text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {active && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500 rounded-full" />}
              </NavLink>
            );
          })}
        </nav>

        <ProfileMenu />
      </div>
    </header>
  );
};

export default Header;
