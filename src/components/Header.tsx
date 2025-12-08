import { useNavigate, NavLink } from "react-router-dom";
import { Home, Search, Library, Trophy, ListVideo } from "lucide-react";
import { cn } from "../lib/utils";
import { ProfileMenu } from "./ProfileMenu";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/search", label: "Rechercher" },
  { to: "/collection", label: "Collection" },
  { to: "/lists", label: "Listes" },
  { to: "/badges", label: "Badges" },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 max-w-7xl mx-auto">
        {/* Logo */}
        <h1
          className="font-serif text-xl sm:text-2xl font-medium text-foreground cursor-pointer tracking-tight"
          onClick={() => navigate("/")}
        >
          Ciné<span className="text-primary">Vault</span>
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <ProfileMenu />
      </div>
    </header>
  );
};
