/**
 * CineVault - Public Collection Page
 * 
 * Page publique pour visualiser la collection d'un utilisateur
 * Accessible via /c/:shareCode
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Library,
  Film,
  Star,
  User,
  ExternalLink,
  TrendingUp,
  Calendar,
  Eye,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getPublicCollectionByCode, 
  PublicCollectionData,
  copyShareLink,
} from "@/services/publicCollectionService";
import { PhysicalFormat, PhysicalMovie } from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Format config
const FORMAT_CONFIG: Record<PhysicalFormat, { label: string; color: string }> = {
  dvd: { label: "DVD", color: "bg-slate-500" },
  bluray: { label: "Blu-ray", color: "bg-blue-600" },
  "4k": { label: "4K UHD", color: "bg-purple-600" },
  steelbook: { label: "Steelbook", color: "bg-amber-600" },
  collector: { label: "Collector", color: "bg-red-600" },
};

// ============================================
// Movie Card for Public View
// ============================================
const PublicMovieCard = ({
  movie,
  details,
  showValue,
}: {
  movie: PhysicalMovie;
  details: MovieDetails | null;
  showValue?: boolean;
}) => {
  const posterUrl = details?.poster_path ? getImageUrl(details.poster_path, "w342") : null;
  const formatConfig = FORMAT_CONFIG[movie.format] || FORMAT_CONFIG.dvd;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-xl overflow-hidden bg-card border border-border/50"
    >
      {/* Format Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge className={cn("text-xs text-white", formatConfig.color)}>
          {formatConfig.label}
        </Badge>
      </div>

      {/* Poster */}
      <div className="aspect-[2/3] bg-muted overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={details?.title || "Movie"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Film className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-1">
          {details?.title || "Chargement..."}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {details?.release_date?.substring(0, 4) || "—"}
          </p>
          {details?.vote_average && details.vote_average > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="text-xs text-amber-500 font-medium">
                {details.vote_average.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        {/* Value if enabled */}
        {showValue && movie.price && (
          <p className="text-xs text-green-500 font-medium mt-1">
            {movie.price.toFixed(2)} €
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================
export default function PublicCollection() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [data, setData] = useState<PublicCollectionData | null>(null);
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch public collection
  useEffect(() => {
    const fetchCollection = async () => {
      if (!shareCode) {
        setError("Code de partage invalide");
        setLoading(false);
        return;
      }

      try {
        const collectionData = await getPublicCollectionByCode(shareCode);
        
        if (!collectionData) {
          setError("Collection non trouvée ou non publique");
          setLoading(false);
          return;
        }

        setData(collectionData);

        // Fetch movie details
        const detailsMap: Record<number, MovieDetails> = {};
        await Promise.all(
          collectionData.movies.slice(0, 50).map(async (movie) => {
            try {
              const details = await getMovieDetails(movie.tmdb_id);
              if (details) {
                detailsMap[movie.tmdb_id] = details;
              }
            } catch (e) {
              // Ignore individual errors
            }
          })
        );
        setMovieDetails(detailsMap);
      } catch (e) {
        setError("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [shareCode]);

  const handleShare = async () => {
    if (!shareCode) return;
    const success = await copyShareLink(shareCode);
    if (success) {
      toast({
        title: "Lien copié !",
        description: "Le lien de la collection a été copié dans le presse-papier.",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Collection non trouvée</h1>
          <p className="text-muted-foreground mb-6">{error || "Cette collection n'existe pas ou n'est plus publique."}</p>
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { settings, profile, movies, stats } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Library className="w-6 h-6 text-amber-500" />
              <span className="font-display font-bold text-lg">CineVault</span>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Partager
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8"
        >
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-amber-500/20 text-amber-500 text-2xl">
              {profile.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">
              {settings.custom_title || `Collection de ${profile.display_name || profile.username}`}
            </h1>
            {settings.custom_description && (
              <p className="text-muted-foreground mt-1">{settings.custom_description}</p>
            )}
            
            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{stats.totalMovies}</span>
                <span className="text-muted-foreground">films</span>
              </div>
              
              {settings.show_values && stats.totalValue && stats.totalValue > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-green-500">
                    {stats.totalValue.toFixed(2)} €
                  </span>
                  <span className="text-muted-foreground">valeur</span>
                </div>
              )}

              {settings.view_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{settings.view_count} vues</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Format breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {Object.entries(stats.formatBreakdown).map(([format, count]) => {
            const config = FORMAT_CONFIG[format as PhysicalFormat];
            if (!config || count === 0) return null;
            
            return (
              <Badge
                key={format}
                variant="secondary"
                className="gap-1"
              >
                <span className={cn("w-2 h-2 rounded-full", config.color)} />
                {config.label}: {count}
              </Badge>
            );
          })}
        </motion.div>

        {/* Movies grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <PublicMovieCard
                movie={movie}
                details={movieDetails[movie.tmdb_id] || null}
                showValue={settings.show_purchase_prices}
              />
            </motion.div>
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Cette collection est vide</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Collection partagée via{" "}
            <Link to="/" className="text-amber-500 hover:underline">
              CineVault
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
