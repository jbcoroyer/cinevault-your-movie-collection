import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Trophy, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Structure : Accueil | Recherche | Collection | Badges | Profil/Connexion
  const navItems = [
    {
      icon: Home,
      label: "Accueil",
      path: "/",
    },
    {
      icon: Search,
      label: "Recherche",
      path: "/search",
    },
    {
      icon: Library,
      label: "Collection",
      path: "/collection",
    },
    {
      icon: Trophy,
      label: "Badges",
      path: "/badges",
    },
    {
      icon: user ? User : LogIn,
      label: user ? "Profil" : "Connexion",
      path: user ? `/profile/${user.id}` : "/auth",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-white/10" />

      <div className="relative flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const isAuthLink = item.path === "/auth";

          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1",
                "transition-all duration-200 active:scale-95",
                isActive
                  ? "text-amber-500"
                  : isAuthLink
                    ? "text-amber-500/70 hover:text-amber-500"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive && "fill-current scale-110",
                  isAuthLink && !isActive && "text-amber-500",
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive ? "opacity-100 font-semibold" : "opacity-70",
                  isAuthLink && !isActive && "text-amber-500 opacity-100",
                )}
              >
                {item.label}
              </span>

              {/* Indicateur actif */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-amber-500 rounded-b-full shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
