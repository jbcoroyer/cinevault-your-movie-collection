import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Library,
  Disc,
  Star,
  Sparkles,
  ArrowRight,
  Users,
  Trophy,
  Film,
  Crown,
  Gem,
} from "lucide-react";
import { getImageUrl, Movie } from "@/services/tmdb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Liste des 50 films cultes TMDB IDs
const CULT_MOVIE_IDS = [
  278, // The Shawshank Redemption
  238, // The Godfather
  240, // The Godfather Part II
  424, // Schindler's List
  389, // 12 Angry Men
  129, // Spirited Away
  19404, // Dilwale Dulhania Le Jayenge
  496243, // Parasite
  497, // The Green Mile
  680, // Pulp Fiction
  122, // The Lord of the Rings: The Return of the King
  13, // Forrest Gump
  429, // The Good, the Bad and the Ugly
  155, // The Dark Knight
  372058, // Your Name
  12477, // Grave of the Fireflies
  769, // GoodFellas
  346, // Seven Samurai
  11216, // Cinema Paradiso
  637, // Life Is Beautiful
  510, // One Flew Over the Cuckoo's Nest
  539, // Psycho
  311, // Once Upon a Time in America
  1891, // The Empire Strikes Back
  1892, // Return of the Jedi
  11, // Star Wars
  120, // The Lord of the Rings: The Fellowship of the Ring
  121, // The Lord of the Rings: The Two Towers
  550, // Fight Club
  807, // Se7en
  599, // Sunset Boulevard
  389614, // Interstellar (Nolan)
  157336, // Interstellar
  244786, // Whiplash
  103, // Taxi Driver
  73, // American History X
  185, // A Clockwork Orange
  640, // Catch Me If You Can
  334541, // Blade Runner 2049
  78, // Blade Runner
  620, // Ghostbusters
  603, // The Matrix
  105, // Back to the Future
  489, // Good Will Hunting
  329865, // Arrival
  274, // The Silence of the Lambs
  901, // The Usual Suspects
  8587, // The Lion King
  862, // Toy Story
  497698, // Black Widow - placeholder
];

// Formats fictifs pour la démo
const DEMO_FORMATS = [
  { id: "4k", label: "4K UHD", color: "from-purple-500 to-indigo-600", icon: Gem },
  { id: "steelbook", label: "Steelbook", color: "from-slate-400 to-slate-600", icon: Crown },
  { id: "collector", label: "Collector", color: "from-amber-500 to-orange-600", icon: Sparkles },
  { id: "bluray", label: "Blu-ray", color: "from-blue-500 to-blue-700", icon: Disc },
  { id: "dvd", label: "DVD", color: "from-amber-400 to-amber-600", icon: Disc },
];

// Attribution aléatoire mais déterministe de formats aux films
const getMovieFormat = (index: number) => {
  const formatPatterns = [
    DEMO_FORMATS[0], // 4K
    DEMO_FORMATS[1], // Steelbook
    DEMO_FORMATS[3], // Blu-ray
    DEMO_FORMATS[2], // Collector
    DEMO_FORMATS[3], // Blu-ray
    DEMO_FORMATS[4], // DVD
    DEMO_FORMATS[0], // 4K
    DEMO_FORMATS[3], // Blu-ray
    DEMO_FORMATS[1], // Steelbook
    DEMO_FORMATS[4], // DVD
  ];
  return formatPatterns[index % formatPatterns.length];
};

interface DemoMovieCardProps {
  movie: Movie;
  format: typeof DEMO_FORMATS[0];
  index: number;
}

const DemoMovieCard = ({ movie, format, index }: DemoMovieCardProps) => {
  const posterUrl = getImageUrl(movie.poster_path, "w342");
  const FormatIcon = format.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative group cursor-pointer",
            "transform transition-all duration-500 ease-out",
            "hover:scale-105 hover:z-10",
            "animate-fade-in"
          )}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          {/* Format Badge */}
          <div
            className={cn(
              "absolute -top-2 -right-2 z-20 px-2 py-1 rounded-full text-[10px] font-bold text-white",
              "flex items-center gap-1 shadow-lg",
              "bg-gradient-to-r",
              format.color
            )}
          >
            <FormatIcon className="w-3 h-3" />
            {format.label}
          </div>

          {/* Poster */}
          <div
            className={cn(
              "relative overflow-hidden rounded-xl",
              "ring-2 ring-white/10 group-hover:ring-amber-500/50",
              "shadow-lg group-hover:shadow-2xl group-hover:shadow-amber-500/20",
              "transition-all duration-300"
            )}
          >
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                <Film className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            {/* Hover Overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "flex items-end p-3"
              )}
            >
              <div>
                <p className="text-white text-sm font-semibold line-clamp-2">
                  {movie.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-amber-400 text-xs font-medium">
                    {movie.vote_average?.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-semibold">{movie.title}</p>
        <p className="text-xs text-muted-foreground">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"} • {format.label}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

interface CollectionShowcaseProps {
  className?: string;
}

export const CollectionShowcase = ({ className }: CollectionShowcaseProps) => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCultMovies = async () => {
      try {
        setLoading(true);
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "2218a5f1d1ccce0122e4be6c67cc7a90";
        const BASE_URL = "https://api.themoviedb.org/3";

        // Fetch les 50 films cultes
        const moviePromises = CULT_MOVIE_IDS.slice(0, 50).map(async (id) => {
          try {
            const res = await fetch(
              `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=fr-FR`
            );
            if (!res.ok) return null;
            return res.json();
          } catch {
            return null;
          }
        });

        const results = await Promise.all(moviePromises);
        const validMovies = results.filter((m): m is Movie => m !== null && m.poster_path);
        setMovies(validMovies);
      } catch (error) {
        console.error("Error fetching cult movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCultMovies();
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                La plateforme des cinéphiles
              </span>
            </div>

            {/* Titre */}
            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              Votre collection de films,{" "}
              <span className="relative">
                <span className="text-amber-500">sublimée</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path
                    d="M2 6C50 2 150 2 198 6"
                    stroke="rgb(245 158 11)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                </svg>
              </span>
            </h1>

            {/* Sous-titre */}
            <p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Cataloguez vos DVD, Blu-ray et 4K UHD. Rejoignez une communauté de passionnés,
              gagnez des badges et découvrez des éditions rares.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold px-8 py-6 rounded-full shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:scale-105"
              >
                <Library className="w-5 h-5 mr-2" />
                Créer ma collection
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto text-base px-8 py-6 rounded-full border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5"
              >
                Se connecter
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Social Proof */}
            <div
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span>+500 collectionneurs</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span>Noté 5/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Grid Showcase */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Une collection d'exception
            </h2>
            <p className="text-muted-foreground">
              50 films cultes en différents formats • Organisez la vôtre gratuitement
            </p>
          </div>

          {/* Movies Grid */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4">
              {movies.slice(0, 30).map((movie, index) => (
                <DemoMovieCard
                  key={movie.id}
                  movie={movie}
                  format={getMovieFormat(index)}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Format Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm">
            {DEMO_FORMATS.map((format) => {
              const FormatIcon = format.icon;
              return (
                <div key={format.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      "bg-gradient-to-r text-white",
                      format.color
                    )}
                  >
                    <FormatIcon className="w-3 h-3" />
                  </div>
                  <span className="text-muted-foreground">{format.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Library, value: "50+", label: "Films cultes", color: "text-amber-500" },
              { icon: Disc, value: "5", label: "Formats supportés", color: "text-blue-500" },
              { icon: Users, value: "500+", label: "Collectionneurs", color: "text-emerald-500" },
              { icon: Trophy, value: "30+", label: "Badges à débloquer", color: "text-purple-500" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  "text-center p-6 rounded-2xl",
                  "bg-card/50 backdrop-blur-sm border border-border/50",
                  "hover:border-amber-500/30 transition-colors",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className={cn("w-8 h-8 mx-auto mb-3", stat.color)} />
                <div className="font-display text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Library className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                Prêt à créer votre collection ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoignez gratuitement CineVault et commencez à cataloguer vos films dès maintenant.
                Suivez votre collection, gagnez des badges et connectez-vous avec d'autres passionnés.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold px-10 py-6 rounded-full shadow-lg shadow-amber-500/25"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CollectionShowcase;
