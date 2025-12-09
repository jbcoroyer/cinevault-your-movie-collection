import { Disc } from "lucide-react";
import { Link } from "react-router-dom";

export const MobileHeader = () => {
  return (
    // fixed : reste en haut même au scroll
    // z-50 : passe au-dessus de tout le contenu
    // bg-background/80 : fond adaptatif (blanc/noir) semi-transparent
    // text-foreground : texte adaptatif (noir/blanc) pour le contraste
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 bg-background/80 backdrop-blur-xl border-b border-border/40 flex justify-center items-center transition-all duration-300">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Disc className="w-5 h-5 text-white animate-spin-slow" />
          <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-foreground">CineVault</span>
      </Link>
    </div>
  );
};
