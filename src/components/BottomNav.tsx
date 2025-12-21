import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Store, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamificationNotifications } from "@/hooks/useGamificationNotifications";
import { useEffect } from "react";

/**
 * BottomNav - Navigation mobile
 *
 * Structure : Accueil | Recherche | Collection | Marketplace | Listes
 * Le profil/paramètres sont accessibles via la photo de profil dans le MobileHeader
 */

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { markBadgesAsSeen, markRewardsAsSeen } = useGamificationNotifications();

  // Mark as seen when visiting badges page
  useEffect(() => {
    if (pathname === "/badges") {
      markBadgesAsSeen();
      markRewardsAsSeen();
    }
  }, [pathname, markBadgesAsSeen, markRewardsAsSeen]);

  const navItems = [
    {
      icon: Home,
      label: "Accueil",
      path: "/",
      showBadge: false,
    },
    {
      icon: Search,
      label: "Recherche",
      path: "/search",
      showBadge: false,
    },
    {
      icon: Library,
      label: "Collection",
      path: "/collection",
      showBadge: false,
    },
    {
      icon: Store,
      label: "Marché",
      path: "/marketplace",
      showBadge: false,
    },
    {
      icon: ListVideo,
      label: "Listes",
      path: "/lists",
      showBadge: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-white/10" />

      <div className="relative flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full gap-1",
                "transition-all duration-200 active:scale-95",
                isActive ? "text-amber-500" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn("w-5 h-5 transition-all duration-300", isActive && "fill-current scale-110")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {/* Notification badge */}
                {item.showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive ? "opacity-100 font-semibold" : "opacity-70",
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
