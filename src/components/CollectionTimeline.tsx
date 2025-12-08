import React from "react";
import { Calendar, Euro, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineEntry, PhysicalMovie, formatLabels } from "@/services/physicalMovies";
import { MovieDetails, getImageUrl } from "@/services/tmdb";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CollectionTimelineProps {
  timelineStats: TimelineEntry[];
  movieDetailsMap: Record<number, MovieDetails>;
  onMovieClick?: (physicalMovie: PhysicalMovie, movieDetails: MovieDetails | null) => void;
}

export const CollectionTimeline: React.FC<CollectionTimelineProps> = ({
  timelineStats,
  movieDetailsMap,
  onMovieClick,
}) => {
  const [expandedMonths, setExpandedMonths] = React.useState<Set<string>>(new Set());

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  if (timelineStats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucun achat enregistré</p>
        <p className="text-sm">Ajoutez des dates d'achat à vos films pour voir la timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Timeline des achats</h3>
      </div>

      <div className="relative">
        {/* Ligne verticale */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {timelineStats.map((entry) => (
            <TimelineMonth
              key={entry.month}
              entry={entry}
              movieDetailsMap={movieDetailsMap}
              isExpanded={expandedMonths.has(entry.month)}
              onToggle={() => toggleMonth(entry.month)}
              onMovieClick={onMovieClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface TimelineMonthProps {
  entry: TimelineEntry;
  movieDetailsMap: Record<number, MovieDetails>;
  isExpanded: boolean;
  onToggle: () => void;
  onMovieClick?: (physicalMovie: PhysicalMovie, movieDetails: MovieDetails | null) => void;
}

const TimelineMonth: React.FC<TimelineMonthProps> = ({
  entry,
  movieDetailsMap,
  isExpanded,
  onToggle,
  onMovieClick,
}) => {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="relative pl-10">
        {/* Point sur la timeline */}
        <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />

        {/* Header du mois */}
        <CollapsibleTrigger asChild>
          <button className="w-full bg-card hover:bg-card/80 border border-border rounded-lg p-4 text-left transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground">{entry.label}</h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{entry.count}</span> film{entry.count > 1 ? "s" : ""}
                  </span>
                  {entry.totalSpent > 0 && (
                    <span className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      <span className="font-medium text-foreground">{entry.totalSpent.toFixed(0)}€</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mini posters preview */}
                <div className="hidden sm:flex -space-x-2">
                  {entry.movies.slice(0, 3).map((pm) => {
                    const details = movieDetailsMap[pm.tmdb_id];
                    const poster = details?.poster_path ? getImageUrl(details.poster_path, "w200") : null;
                    return poster ? (
                      <img
                        key={pm.id}
                        src={poster}
                        alt=""
                        className="w-8 h-12 object-cover rounded border-2 border-background"
                      />
                    ) : null;
                  })}
                  {entry.movies.length > 3 && (
                    <div className="w-8 h-12 rounded bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      +{entry.movies.length - 3}
                    </div>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Liste des films du mois */}
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            {entry.movies.map((pm) => {
              const details = movieDetailsMap[pm.tmdb_id];
              return (
                <TimelineMovieItem
                  key={pm.id}
                  physicalMovie={pm}
                  movieDetails={details || null}
                  onClick={() => onMovieClick?.(pm, details || null)}
                />
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

interface TimelineMovieItemProps {
  physicalMovie: PhysicalMovie;
  movieDetails: MovieDetails | null;
  onClick?: () => void;
}

const TimelineMovieItem: React.FC<TimelineMovieItemProps> = ({
  physicalMovie,
  movieDetails,
  onClick,
}) => {
  const poster = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w200") : null;
  const purchaseDate = physicalMovie.purchase_date
    ? new Date(physicalMovie.purchase_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
    >
      {poster ? (
        <img src={poster} alt={movieDetails?.title} className="w-10 h-14 object-cover rounded" />
      ) : (
        <div className="w-10 h-14 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
          ?
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{movieDetails?.title || "Film inconnu"}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-1.5 py-0.5 bg-background rounded">
            {formatLabels[physicalMovie.format]}
          </span>
          {purchaseDate && <span>{purchaseDate}</span>}
        </div>
      </div>
      {physicalMovie.price && (
        <span className="text-sm font-medium text-primary">{physicalMovie.price.toFixed(0)}€</span>
      )}
    </button>
  );
};
