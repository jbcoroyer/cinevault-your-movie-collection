import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Loader2, Trash2, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { Movie } from "@/services/tmdb";
import { PhysicalFormat } from "@/services/physicalMovies";
import { ScanQueueItem } from "@/services/barcodeService";

interface ScannedItem extends ScanQueueItem {
  movies?: Movie[];
  detectedFormat?: PhysicalFormat;
}

interface ScanResultCardProps {
  item: ScannedItem;
  onSelectMovie: (movie: Movie) => void;
  onChangeFormat: (format: PhysicalFormat) => void;
  onRemove: () => void;
}

const formatLabels: Record<PhysicalFormat, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  "4k": "4K UHD",
  steelbook: "Steelbook",
  collector: "Édition Collector",
};

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  item,
  onSelectMovie,
  onChangeFormat,
  onRemove,
}) => {
  const statusConfig = {
    processing: {
      icon: Loader2,
      color: "text-videoclub-cyan",
      label: "Recherche...",
      animate: true,
    },
    found: {
      icon: CheckCircle2,
      color: "text-green-500",
      label: "Trouvé",
      animate: false,
    },
    not_found: {
      icon: XCircle,
      color: "text-orange-500",
      label: "Non trouvé",
      animate: false,
    },
    error: {
      icon: XCircle,
      color: "text-destructive",
      label: "Erreur",
      animate: false,
    },
  };

  const config = statusConfig[item.status];
  const StatusIcon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              "w-4 h-4",
              config.color,
              config.animate && "animate-spin"
            )}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {item.ean}
          </span>
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Product info */}
      {item.product && (
        <p className="text-sm text-muted-foreground truncate">
          {item.product.title}
        </p>
      )}

      {/* Movie selection */}
      {item.status === "found" && (
        <div className="space-y-2">
          {item.movies && item.movies.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                {item.movies.length === 1 ? (
                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                      item.selectedMovie?.id === item.movies[0].id
                        ? "border-videoclub-cyan bg-videoclub-cyan/10"
                        : "border-border hover:border-videoclub-cyan/50"
                    )}
                    onClick={() => onSelectMovie(item.movies![0])}
                  >
                    {item.movies[0].poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.movies[0].poster_path}`}
                        alt={item.movies[0].title}
                        className="w-8 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-8 h-12 bg-muted rounded flex items-center justify-center">
                        <Film className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.movies[0].title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.movies[0].release_date?.substring(0, 4)}
                      </p>
                    </div>
                    {item.selectedMovie?.id === item.movies[0].id && (
                      <CheckCircle2 className="w-4 h-4 text-videoclub-cyan" />
                    )}
                  </div>
                ) : (
                  <Select
                    value={item.selectedMovie?.id.toString() || ""}
                    onValueChange={(value) => {
                      const movie = item.movies?.find(
                        (m) => m.id.toString() === value
                      );
                      if (movie) onSelectMovie(movie);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner le film..." />
                    </SelectTrigger>
                    <SelectContent>
                      {item.movies.map((movie) => (
                        <SelectItem key={movie.id} value={movie.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{movie.title}</span>
                            <span className="text-muted-foreground text-xs">
                              ({movie.release_date?.substring(0, 4)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Format selector */}
              <Select
                value={item.detectedFormat || "bluray"}
                onValueChange={(value) => onChangeFormat(value as PhysicalFormat)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formatLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-xs text-orange-500">
              Film non trouvé automatiquement. Utilisez la recherche manuelle pour l'ajouter.
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {item.status === "error" && item.error && (
        <p className="text-xs text-destructive">{item.error}</p>
      )}

      {/* Not found helper */}
      {item.status === "not_found" && (
        <p className="text-xs text-muted-foreground">
          Produit non reconnu. Utilisez la recherche manuelle pour ajouter ce film.
        </p>
      )}
    </div>
  );
};
