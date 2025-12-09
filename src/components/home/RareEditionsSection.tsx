import React from "react";
import { Link } from "react-router-dom";
import { useRareEditions, editionFormatConfig, conditionLabels } from "@/hooks/useRareEditions";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Gem, 
  ArrowRight, 
  Sparkles,
  Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * RareEditionsSection — Section des éditions rares et collectors
 * 
 * Met en avant les Steelbooks, Éditions Collector et 4K UHD
 * récemment ajoutés à la communauté
 */

interface RareEditionsSectionProps {
  className?: string;
  limit?: number;
}

export const RareEditionsSection: React.FC<RareEditionsSectionProps> = ({ 
  className,
  limit = 8 
}) => {
  const { editions, loading } = useRareEditions({ limit });

  if (loading) {
    return (
      <section className={cn("px-4 sm:px-6 py-8", className)}>
        <div className="container mx-auto">
          <div className="mb-6">
            <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div 
                key={i} 
                className="aspect-[3/4] rounded-2xl bg-muted animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (editions.length === 0) {
    return (
      <section className={cn("px-4 sm:px-6 py-8", className)}>
        <div className="container mx-auto">
          <GlassCard variant="subtle" padding="lg" className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Gem className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              Aucune édition rare récente
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Soyez le premier à ajouter un Steelbook ou une édition Collector !
            </p>
          </GlassCard>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("px-4 sm:px-6 py-8", className)}>
      <div className="container mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20">
              <Gem className="w-6 h-6 text-amber-500" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold">
                Raretés & Collectors
              </h2>
              <p className="text-sm text-muted-foreground">
                Les dernières pépites ajoutées par la communauté
              </p>
            </div>
          </div>
          <Link
            to="/search"
            className={cn(
              "hidden sm:flex items-center gap-1.5",
              "text-sm font-medium text-primary",
              "hover:underline"
            )}
          >
            Tout voir
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Editions grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {editions.map((edition, index) => (
            <RareEditionCard 
              key={edition.id} 
              edition={edition}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Individual rare edition card
interface RareEditionCardProps {
  edition: ReturnType<typeof useRareEditions>["editions"][0];
  index: number;
}

const RareEditionCard: React.FC<RareEditionCardProps> = ({ edition, index }) => {
  const formatConf = editionFormatConfig[edition.format as keyof typeof editionFormatConfig];
  const initials = edition.username.slice(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(edition.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Link
      to={`/movie/${edition.tmdbId}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-card/80 backdrop-blur-xl",
        "border border-white/10 dark:border-white/5",
        "transition-all duration-500",
        "hover:shadow-2xl hover:-translate-y-2",
        formatConf?.bgGlow,
        "opacity-0 animate-fade-in-up"
      )}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "forwards",
      }}
    >
      {/* Format badge - floating */}
      <div className={cn(
        "absolute top-3 left-3 z-20",
        "px-2.5 py-1 rounded-full",
        "bg-gradient-to-r",
        formatConf?.gradient,
        "text-white text-xs font-semibold",
        "shadow-lg",
        "flex items-center gap-1.5"
      )}>
        <span>{formatConf?.icon}</span>
        <span>{formatConf?.label}</span>
      </div>

      {/* Poster */}
      <div className="relative aspect-poster overflow-hidden">
        {edition.moviePosterPath ? (
          <img
            src={getImageUrl(edition.moviePosterPath, "w500") || ""}
            alt={edition.movieTitle}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-muted to-muted/50 flex items-center justify-center">
            <Gem className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-30",
          "bg-gradient-to-t",
          formatConf?.gradient,
          "transition-opacity duration-500"
        )} />

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {/* Movie info */}
          <h3 className="font-display text-base sm:text-lg font-semibold text-white line-clamp-2 mb-1.5">
            {edition.movieTitle}
          </h3>
          <div className="flex items-center gap-2 text-white/70 text-xs mb-3">
            <span>{edition.movieYear}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span>{conditionLabels[edition.condition]}</span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 backdrop-blur-sm">
            <Avatar className="w-7 h-7 ring-1 ring-white/20">
              <AvatarImage src={edition.avatarUrl || undefined} alt={edition.username} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                @{edition.username}
              </p>
              <p className="text-[10px] text-white/50 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </p>
            </div>
          </div>
        </div>

        {/* Shine effect on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100",
          "bg-gradient-to-r from-transparent via-white/10 to-transparent",
          "translate-x-[-100%] group-hover:translate-x-[100%]",
          "transition-all duration-1000 ease-in-out",
          "pointer-events-none"
        )} />
      </div>
    </Link>
  );
};

export default RareEditionsSection;
