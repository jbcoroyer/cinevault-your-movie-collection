import { Disc } from "lucide-react";
import { Link } from "react-router-dom";

export const MobileHeader = () => {
  return (
    <div className="md:hidden sticky top-0 z-50 pt-safe pb-2 px-4 bg-background/80 backdrop-blur-xl border-b border-white/5 flex justify-center items-center shadow-sm transition-all duration-300 w-full">
      <Link to="/" className="flex items-center gap-2.5 h-10 mt-2">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Disc className="w-5 h-5 text-white animate-spin-slow" />
          <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
          CineVault
        </span>
      </Link>
    </div>
  );
};
