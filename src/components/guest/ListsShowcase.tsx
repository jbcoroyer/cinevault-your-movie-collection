import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ListVideo,
  Star,
  Sparkles,
  ArrowRight,
  Film,
  Clock,
  Eye,
  Heart,
  Plus,
  Users,
  Globe,
  Lock,
  Check,
  TrendingUp,
} from "lucide-react";
import { getImageUrl, Movie } from "@/services/tmdb";

// Liste des 50 films cultes TMDB IDs (même liste que CollectionShowcase)
const CULT_MOVIE_IDS = [
  278, 238, 240, 424, 389, 129, 19404, 496243, 497, 680,
  122, 13, 429, 155, 372058, 12477, 769, 346, 11216, 637,
  510, 539, 311, 1891, 1892, 11, 120, 121, 550, 807,
  599, 389614, 157336, 244786, 103, 73, 185, 640, 334541, 78,
  620, 603, 105, 489, 329865, 274, 901, 8587, 862, 497698,
];

// Listes de démonstration
const DEMO_LISTS = [
  {
    id: "watchlist",
    title: "Ma Watchlist",
    icon: Clock,
    color: "from-blue-500 to-blue-700",
    description: "Films à voir absolument",
    movieCount: 47,
    isPublic: false,
  },
  {
    id: "watched",
    title: "Films Vus",
    icon: Eye,
    color: "from-emerald-500 to-emerald-700",
    description: "Mon historique de visionnage",
    movieCount: 256,
    isPublic: false,
  },
  {
    id: "favorites",
    title: "Mes Favoris",
    icon: Heart,
    color: "from-rose-500 to-rose-700",
    description: "Les films que j'adore",
    movieCount: 42,
    isPublic: true,
  },
  {
    id: "nolan",
    title: "Filmographie Nolan",
    icon: Film,
    color: "from-amber-500 to-orange-600",
    description: "Tous les films de Christopher Nolan",
    movieCount: 12,
    isPublic: true,
  },
  {
    id: "horror",
    title: "Soirée Frisson",
    icon: Sparkles,
    color: "from-purple-500 to-purple-700",
    description: "Les meilleurs films d'horreur",
    movieCount: 28,
    isPublic: true,
  },
  {
    id: "family",
    title: "Films en Famille",
    icon: Users,
    color: "from-cyan-500 to-cyan-700",
    description: "Pour les soirées ciné avec les enfants",
    movieCount: 35,
    isPublic: true,
  },
];

interface DemoListCardProps {
  list: typeof DEMO_LISTS[0];
  movies: Movie[];
  index: number;
}

const DemoListCard = ({ list, movies, index }: DemoListCardProps) => {
  const Icon = list.icon;
  const posters = movies.slice(index * 5, index * 5 + 4);

  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden cursor-pointer",
        "bg-card/80 border border-border/50",
        "hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10",
        "transition-all duration-300",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Poster Collage Background */}
      <div className="relative h-32 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-4 gap-0.5">
          {posters.map((movie, i) => (
            <div key={movie?.id || i} className="relative overflow-hidden">
              {movie?.poster_path ? (
                <img
                  src={getImageUrl(movie.poster_path, "w185")}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>
          ))}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        
        {/* Icon Badge */}
        <div
          className={cn(
            "absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            list.color
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Public/Private Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs">
          {list.isPublic ? (
            <>
              <Globe className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Public</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Privé</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 group-hover:text-amber-500 transition-colors">
          {list.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
          {list.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <Film className="w-4 h-4 inline mr-1" />
            {list.movieCount} films
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

// Liste de films cultes avec posters
interface CultMovieRowProps {
  movies: Movie[];
  title: string;
}

const CultMovieRow = ({ movies, title }: CultMovieRowProps) => {
  return (
    <div className="mb-8">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-amber-500" />
        {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {movies.slice(0, 15).map((movie, index) => (
          <div
            key={movie.id}
            className={cn(
              "flex-shrink-0 group cursor-pointer",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="relative overflow-hidden rounded-lg w-28 aspect-[2/3]">
              {movie.poster_path ? (
                <img
                  src={getImageUrl(movie.poster_path, "w185")}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-center p-2">
                  <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-amber-400 text-sm font-bold">
                    {movie.vote_average?.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-center mt-2 text-muted-foreground line-clamp-1 w-28">
              {movie.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ListsShowcaseProps {
  className?: string;
}

export const ListsShowcase = ({ className }: ListsShowcaseProps) => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCultMovies = async () => {
      try {
        setLoading(true);
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "2218a5f1d1ccce0122e4be6c67cc7a90";
        const BASE_URL = "https://api.themoviedb.org/3";

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

  const features = [
    { icon: Clock, title: "Watchlist", description: "Ne perdez plus un film de vue" },
    { icon: Eye, title: "Films Vus", description: "Votre historique personnel" },
    { icon: Heart, title: "Favoris", description: "Vos coups de cœur" },
    { icon: Plus, title: "Listes Perso", description: "Créez vos propres listes" },
  ];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 animate-fade-in">
              <ListVideo className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Organisation de votre cinéma
              </span>
            </div>

            {/* Titre */}
            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              Vos listes{" "}
              <span className="relative">
                <span className="text-blue-500">personnalisées</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path
                    d="M2 6C75 2 225 2 298 6"
                    stroke="rgb(59 130 246)"
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
              Organisez votre univers cinématographique. Créez des listes thématiques,
              gérez votre watchlist et partagez vos découvertes.
            </p>

            {/* CTA */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold px-8 py-6 rounded-full shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
              >
                <ListVideo className="w-5 h-5 mr-2" />
                Créer mes listes
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto text-base px-8 py-6 rounded-full border-border/50 hover:border-blue-500/30 hover:bg-blue-500/5"
              >
                Se connecter
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Lists Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Exemples de listes
            </h2>
            <p className="text-muted-foreground">
              Créez autant de listes que vous voulez pour organiser vos films
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {DEMO_LISTS.map((list, index) => (
              <DemoListCard
                key={list.id}
                list={list}
                movies={movies}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Cult Movies Row */}
      {!loading && movies.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <CultMovieRow movies={movies} title="Les 50 films cultes à avoir en liste" />
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "text-center p-6 rounded-2xl",
                  "bg-card/50 backdrop-blur-sm border border-border/50",
                  "hover:border-blue-500/30 transition-colors",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Ce que vous pouvez organiser
            </h2>
            <div className="space-y-4">
              {[
                "Gérez votre Watchlist et ne ratez plus un film",
                "Suivez tous les films que vous avez vus",
                "Marquez vos favoris d'un coup de cœur",
                "Créez des listes thématiques (ex: 'Soirée Frisson', 'Classics')",
                "Partagez vos listes publiquement ou gardez-les privées",
                "Ajoutez des films facilement depuis la recherche",
                "Collaborez avec d'autres utilisateurs sur des listes partagées",
              ].map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl",
                    "bg-card/50 border border-border/50",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <ListVideo className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                Prêt à organiser votre cinéma ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Créez votre compte gratuit et commencez à organiser vos films dès maintenant.
                Watchlist, favoris, listes personnalisées... tout est possible !
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold px-10 py-6 rounded-full shadow-lg shadow-blue-500/25"
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

export default ListsShowcase;
