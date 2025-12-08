import { useNavigate, NavLink } from "react-router-dom";
import { Home, Search, Library, Trophy, ListVideo, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Header — Navigation principale glassmorphism
 *
 * @description Header flottant avec effet verre dépoli,
 * navigation centrée et indicateurs animés.
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
  const [scrolled, setScrolled] = useState(false);

  // Détection du scroll pour effet condensé
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch collection count
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
    <header
      className={cn(
        "sticky top-0 z-50",
        "transition-all duration-500 ease-out",
        // Glass effect
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-white/10 dark:border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          : "bg-transparent",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between container mx-auto",
          "transition-all duration-300",
          scrolled ? "h-14 px-4" : "h-16 px-4 sm:px-6",
        )}
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className={cn("flex items-center gap-2 group", "transition-transform duration-300 hover:scale-105")}
        >
          {/* Logo Icon */}
          <div
            className={cn(
              "relative w-8 h-8 rounded-lg overflow-hidden",
              "bg-gradient-to-br from-primary to-primary/70",
              "flex items-center justify-center",
              "shadow-glow-sm",
              "transition-all duration-300 group-hover:shadow-glow",
            )}
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>

          {/* Logo Text */}
          <span className={cn("text-xl font-display font-bold tracking-tight", "transition-all duration-300")}>
            Cine<span className="text-gradient-gold">Vault</span>
          </span>
        </button>

        {/* Desktop Navigation - Centered */}
        <nav
          className={cn(
            "hidden md:flex items-center gap-1",
            "absolute left-1/2 -translate-x-1/2",
            // Glass pill container
            "px-2 py-1.5 rounded-2xl",
            "bg-card/50 backdrop-blur-lg",
            "border border-white/10 dark:border-white/5",
            "shadow-[0_2px_20px_rgba(0,0,0,0.06)]",
          )}
        >
          {navItems.map(({ to, icon: Icon, label, highlight, showBadge }) => (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-xl",
                      "text-sm font-medium",
                      "transition-all duration-300",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        <Icon
                          className={cn("w-4 h-4", "transition-all duration-300", isActive && "scale-110")}
                          strokeWidth={isActive ? 2.5 : 2}
                        />

                        {/* Badge count */}
                        {showBadge && collectionCount > 0 && (
                          <span
                            className={cn(
                              "absolute -top-1.5 -right-1.5",
                              "min-w-[16px] h-4 px-1",
                              "flex items-center justify-center",
                              "text-[10px] font-bold",
                              "bg-primary text-primary-foreground",
                              "rounded-full",
                              "animate-fade-in-scale",
                            )}
                          >
                            {collectionCount > 99 ? "99+" : collectionCount}
                          </span>
                        )}
                      </div>

                      <span className="hidden lg:inline">{label}</span>

                      {/* Active indicator dot */}
                      {isActive && (
                        <span
                          className={cn(
                            "absolute bottom-1 left-1/2 -translate-x-1/2",
                            "w-1 h-1 rounded-full bg-primary",
                            "animate-fade-in-scale",
                          )}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Right Side - Profile */}
        <div className="flex items-center gap-3">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};
