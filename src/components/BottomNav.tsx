import { Home, Search, Library, Trophy, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection" },
  { to: "/badges", icon: Trophy, label: "Badges" },
  { to: "/profile", icon: User, label: "Profil" },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 md:hidden">
      {/* Safe area padding for iOS */}
      <div className="pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-evenly items-center h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 px-1 rounded-lg transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground active:text-foreground active:bg-muted/50",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn("p-1.5 rounded-full transition-all duration-200", isActive && "bg-primary/15")}>
                    <Icon
                      className={cn("w-5 h-5 transition-all duration-200", isActive && "scale-110")}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  <span className={cn("text-[10px] font-medium leading-tight", isActive && "font-semibold")}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
