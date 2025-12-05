import { useNavigate, NavLink } from "react-router-dom";
import { Home, Search, Library, User, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./ProfileMenu";

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/collection", icon: Library, label: "Collection" },
  { to: "/lists", icon: ListVideo, label: "Listes" },
  { to: "/profile", icon: User, label: "Profil" },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 container mx-auto relative">
        <h1 className="text-xl font-bold text-foreground cursor-pointer" onClick={() => navigate("/")}>
          Cine<span className="text-primary">Vault</span>
        </h1>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  label === "Collection"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    : isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <ProfileMenu />
      </div>
    </header>
  );
};
