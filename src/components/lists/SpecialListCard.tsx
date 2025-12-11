import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

interface SpecialListCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  backdrop: string | null;
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
  backdrop,
  onClick,
  loading = false,
  variant = "default",
  type = "watchlist",
  className,
}: SpecialListCardProps) {
  // Configuration des couleurs selon le type de liste
  const styles = {
    watchlist: {
      gradient: "from-blue-600/80 to-purple-600/80",
      iconColor: "text-blue-200",
      iconBg: "bg-blue-500/20",
      borderHover: "hover:border-blue-500/50",
    },
    watched: {
      gradient: "from-emerald-600/80 to-teal-600/80",
      iconColor: "text-emerald-200",
      iconBg: "bg-emerald-500/20",
      borderHover: "hover:border-emerald-500/50",
    },
    favorites: {
      gradient: "from-rose-600/80 to-amber-600/80",
      iconColor: "text-rose-200",
      iconBg: "bg-rose-500/20",
      borderHover: "hover:border-rose-500/50",
    },
  };

  const style = styles[type] || styles.watchlist;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-3xl w-full transition-all duration-500",
        "border border-white/10 dark:border-white/5",
        "shadow-lg hover:shadow-2xl hover:scale-[1.02]",
        style.borderHover,
        variant === "featured" ? "h-56 md:h-64" : "h-40 md:h-48",
        className,
      )}
    >
      {/* Background Image avec Zoom effect */}
      <div className="absolute inset-0 bg-muted">
        {backdrop ? (
          <img
            src={getImageUrl(backdrop, "w780") || ""}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center opacity-30">
            <Sparkles className="w-20 h-20 text-white/10" />
          </div>
        )}
      </div>

      {/* Overlay Gradient dynamique */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity duration-300 group-hover:opacity-90",
          style.gradient,
        )}
      />

      {/* Overlay noir pour texte */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Contenu */}
      <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between text-left">
        {/* En-tête : Icône + Compteur */}
        <div className="flex justify-between items-start">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 transition-transform group-hover:rotate-6",
              style.iconBg,
            )}
          >
            <Icon className={cn("w-6 h-6", style.iconColor)} />
          </div>

          <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-medium font-mono">
            {loading ? <span className="inline-block w-4 h-3 bg-white/20 animate-pulse rounded" /> : count}
          </div>
        </div>

        {/* Pied : Titre + CTA */}
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-1 tracking-tight drop-shadow-sm group-hover:translate-x-1 transition-transform duration-300">
            {title}
          </h2>
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <span>Explorer</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </button>
  );
}
