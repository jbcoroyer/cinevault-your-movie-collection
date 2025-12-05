import { Home, Search, Library, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection" },
  { to: "/profile", icon: User, label: "Profil" },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 rounded-button transition-all duration-300",
                label === "Collection"
                  ? "bg-primary text-primary-foreground px-4 py-3 -mt-8 rounded-full shadow-lg border-4 border-background hover:scale-105 active:scale-95"
                  : "px-4 py-2",
                label !== "Collection" && (isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"),
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "transition-all duration-200",
                    label === "Collection" ? "w-6 h-6" : "w-5 h-5",
                    label !== "Collection" && isActive && "scale-110",
                  )}
                  strokeWidth={isActive || label === "Collection" ? 2.5 : 2}
                />
                {label !== "Collection" && <span className="text-[10px] font-medium">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
