import { Disc, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";

export const MobileHeader = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 bg-background/80 backdrop-blur-xl border-b border-border/40 flex justify-between items-center transition-all duration-300">
      {/* Logo centré */}
      <Link to="/" className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Disc className="w-5 h-5 text-white animate-spin-slow" />
          <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-foreground">CineVault</span>
      </Link>

      {/* Bouton connexion (visible seulement si non connecté) */}
      {!loading && !user && (
        <Button
          size="sm"
          onClick={() => navigate("/auth")}
          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 h-8"
        >
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          Connexion
        </Button>
      )}

      {/* Avatar miniature si connecté */}
      {!loading && user && (
        <button
          onClick={() => navigate(`/profile/${user.id}`)}
          className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xs font-semibold"
        >
          {user.email?.slice(0, 2).toUpperCase() || "U"}
        </button>
      )}
    </div>
  );
};
