import { useNavigate, NavLink } from "react-router-dom";
import { Home, Search, Library, Trophy, ListVideo } from "lucide-react";
import { cn } from "../lib/utils";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 container mx-auto relative">
        <h1 className="text-xl font-bold text-foreground cursor-pointer" onClick={() => navigate("/")}>
          Cine<span className="text-primary">Vault</span>
        </h1>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map(({ to, icon: Icon, label, highlight, showBadge }) => (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-primary bg-primary/10"
                        : highlight
                          ? "text-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        <Icon className={cn("w-4 h-4", highlight && !isActive && "text-primary")} />
                        {showBadge && collectionCount > 0 && (
                          <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                            {collectionCount > 99 ? "99+" : collectionCount}
                          </span>
                        )}
                      </div>
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              {showBadge && collectionCount > 0 && (
                <TooltipContent>
                  <p>
                    {collectionCount} film{collectionCount > 1 ? "s" : ""} dans votre collection
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        <ProfileMenu />
      </div>
    </header>
  );
};
