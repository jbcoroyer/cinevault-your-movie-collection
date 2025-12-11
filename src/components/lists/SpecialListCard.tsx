import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { ListPosterStack } from "./ListPosterStack";

interface SpecialListCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  posters: string[];
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "featured";
  type?: "watchlist" | "watched" | "favorites";
  className?: string;
}

export function SpecialListCard({
  title,
  count,
  icon: Icon,
  posters,
  onClick,
  loading = false,
  variant = "default",
  type = "watchlist",
  className,
}: SpecialListCardProps) {
  const styles = {
    watchlist: {
      gradient: "from-blue-600/20 to-purple-600/20",
      accent: "text-blue-400",
      border: "hover:border-blue-500/50",
    },
    watched: {
      gradient: "from-emerald-600/20 to-teal-600/20",
      accent: "text-emerald-400",
      border: "hover:border-emerald-500/50",
    },
    favorites: {
      gradient: "from-rose-600/20 to-amber-600/20",
      accent: "text-rose-400",
      border: "hover:border-rose-500/50",
    },
  };

  const style = styles[type] || styles.watchlist;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-3xl w-full h-64 md:h-72 transition-all duration-500",
        "border border-white/10 dark:border-white/5 bg-card",
        "shadow-lg hover:shadow-2xl hover:scale-[1.02]",
        style.border,
        className,
      )}
    >
      {/* Contenu visuel (Stack de posters) */}
      <div className="absolute inset-0 bottom-16">
        <ListPosterStack posters={posters} count={count} className="h-full" />

        {/* Gradient Overlay */}
        <div className={cn("absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card opacity-100")} />

        {/* Accent Color Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
            style.gradient,
          )}
        />
      </div>

      {/* En-tête (Icon + Count) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md bg-black/30 border border-white/10 transition-transform group-hover:rotate-12",
            style.accent,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-medium font-mono">
          {loading ? <span className="inline-block w-4 h-3 bg-white/20 animate-pulse rounded" /> : count}
        </div>
      </div>

      {/* Pied (Titre) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <h2 className="text-2xl font-display font-bold text-white mb-1 tracking-tight group-hover:translate-x-1 transition-transform duration-300 text-left">
          {title}
        </h2>
        <div className="flex items-center gap-2 text-white/70 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <span>Ouvrir la collection</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
}
