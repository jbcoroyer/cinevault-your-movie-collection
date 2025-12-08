import { useNavigate, NavLink } from "react-router-dom";
import { Home, Search, Library, Trophy, ListVideo } from "lucide-react";
import { cn } from "../lib/utils";
import { ProfileMenu } from "./ProfileMenu";

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection" },
  { to: "/lists", icon: ListVideo, label: "Listes" },
  { to: "/badges", icon: Trophy, label: "Badges" },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
        {/* Logo */}
        <h1
          className="text-lg sm:text-xl font-bold text-foreground cursor-pointer flex-shrink-0"
          onClick={() => navigate("/")}
        >
          Cine<span className="text-primary">Vault</span>
        </h1>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center max-w-2xl mx-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Profile Menu */}
        <div className="flex-shrink-0">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};
