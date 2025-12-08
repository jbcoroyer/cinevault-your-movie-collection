import { useNavigate, NavLink } from "react-router-dom";
import { Home, Search, Library, Trophy, ListVideo, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Header - Navigation principale avec effet glass
 *
 * Features:
 * - Glassmorphism avec blur
 * - Navigation centrée avec indicateur actif
 * - Badge de collection animé
 * - Logo avec gradient
 */

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection", highlight: true, showBadge: true },
  { to: "/lists", icon: ListVideo, label: "Listes" },
  { to: "/badges", icon: Trophy, label: "Badges" },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
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
      .channel("collection-count-header")
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
    <header className="sticky top-0 z-50 nav-glass border-b border-border/50">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16 container mx-auto relative">
        {/* Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group" aria-label="Accueil CineVault">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">
            Cine<span className="text-gradient">Vault</span>
          </span>
        </button>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map(({ to, icon: Icon, label, highlight, showBadge }) => (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn("w-4 h-4 transition-transform duration-300", isActive && "scale-110")}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span>{label}</span>

                      {/* Badge de collection */}
                      {showBadge && collectionCount > 0 && (
                        <span
                          className={cn(
                            "absolute -top-1 -right-1 min-w-[18px] h-[18px]",
                            "flex items-center justify-center px-1",
                            "text-[10px] font-bold rounded-full",
                            "bg-primary text-primary-foreground",
                            "animate-pulse-glow",
                          )}
                        >
                          {collectionCount > 99 ? "99+" : collectionCount}
                        </span>
                      )}

                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Profile Menu */}
        <div className="flex items-center gap-3">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
