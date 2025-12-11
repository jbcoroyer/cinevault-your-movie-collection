import { getImageUrl } from "@/services/tmdb";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecialListCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  backdrop: string | null;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "featured";
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
  className,
}: SpecialListCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 w-full transition-all duration-500",
        variant === "featured" ? "h-40 md:h-48" : "h-28 md:h-32",
        "glass-elevated hover:scale-[1.02]",
        className
      )}
    >
      {/* Background image */}
      {backdrop ? (
        <img
          src={getImageUrl(backdrop, "w780") || ""}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-50"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Film className="w-16 h-16 text-muted-foreground/10" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Aurora glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-primary/20 blur-3xl" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
        <div className="flex items-end justify-between">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-display font-bold tracking-tight">
                {title}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {loading ? (
                <span className="inline-block w-12 h-4 bg-muted animate-pulse rounded" />
              ) : (
                `${count} film${count !== 1 ? "s" : ""}`
              )}
            </p>
          </div>
          
          {/* Arrow indicator */}
          <div className="p-2 rounded-full bg-foreground/5 group-hover:bg-primary/20 transition-all duration-300 group-hover:translate-x-1">
            <svg
              className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}
