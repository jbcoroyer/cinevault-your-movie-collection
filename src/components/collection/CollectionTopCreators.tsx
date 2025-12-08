import React from "react";
import { Clapperboard, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DirectorStats, ActorStats } from "@/services/physicalMovies";

interface CollectionTopCreatorsProps {
  directorStats: DirectorStats[];
  actorStats: ActorStats[];
  onDirectorClick?: (director: string) => void;
  onActorClick?: (actor: string) => void;
}

export const CollectionTopCreators: React.FC<CollectionTopCreatorsProps> = ({
  directorStats,
  actorStats,
  onDirectorClick,
  onActorClick,
}) => {
  const topDirectors = directorStats.slice(0, 5);
  const topActors = actorStats.slice(0, 5);

  if (topDirectors.length === 0 && topActors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Vos favoris</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Réalisateurs */}
        {topDirectors.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clapperboard className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">Top Réalisateurs</h4>
            </div>
            <div className="space-y-3">
              {topDirectors.map((director, index) => (
                <CreatorRow
                  key={director.name}
                  rank={index + 1}
                  name={director.name}
                  count={director.count}
                  maxCount={topDirectors[0].count}
                  onClick={() => onDirectorClick?.(director.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top Acteurs */}
        {topActors.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">Top Acteurs</h4>
            </div>
            <div className="space-y-3">
              {topActors.map((actor, index) => (
                <CreatorRow
                  key={actor.name}
                  rank={index + 1}
                  name={actor.name}
                  count={actor.count}
                  maxCount={topActors[0].count}
                  onClick={() => onActorClick?.(actor.name)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CreatorRowProps {
  rank: number;
  name: string;
  count: number;
  maxCount: number;
  onClick?: () => void;
}

const CreatorRow: React.FC<CreatorRowProps> = ({ rank, name, count, maxCount, onClick }) => {
  const percentage = (count / maxCount) * 100;

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-500 text-white";
      case 2:
        return "bg-slate-400 text-white";
      case 3:
        return "bg-amber-700 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
    >
      <span
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          getRankStyle(rank)
        )}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium truncate group-hover:text-primary transition-colors">
            {name}
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            {count} film{count > 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </button>
  );
};

// Version compacte pour sidebar ou widget
interface CompactTopCreatorsProps {
  directorStats: DirectorStats[];
  actorStats: ActorStats[];
  limit?: number;
}

export const CompactTopCreators: React.FC<CompactTopCreatorsProps> = ({
  directorStats,
  actorStats,
  limit = 3,
}) => {
  const topDirectors = directorStats.slice(0, limit);
  const topActors = actorStats.slice(0, limit);

  return (
    <div className="space-y-4">
      {topDirectors.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Clapperboard className="w-3 h-3" />
            Réalisateurs
          </p>
          <div className="flex flex-wrap gap-1">
            {topDirectors.map((d) => (
              <span
                key={d.name}
                className="text-xs px-2 py-1 bg-muted rounded-full"
              >
                {d.name} ({d.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {topActors.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Acteurs
          </p>
          <div className="flex flex-wrap gap-1">
            {topActors.map((a) => (
              <span
                key={a.name}
                className="text-xs px-2 py-1 bg-muted rounded-full"
              >
                {a.name} ({a.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
