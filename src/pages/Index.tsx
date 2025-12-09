import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { MovieSection } from "../components/MovieSection";
import { FollowingMoviesSection } from "../components/FollowingMoviesSection";
import { getPopularMovies, Movie, getImageUrl, MovieDetails } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeNotification } from "../contexts/BadgeNotificationContext";
import { getPhysicalMovies, PhysicalMovie } from "../services/physicalMovies";
import { supabase } from "../lib/supabase";
import {
  ChevronRight,
  Trophy,
  UserPlus,
  Zap,
  Library,
  Heart,
  Eye,
  Disc,
  Users,
  ArrowRight,
  Activity,
  Coins,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { cn } from "../lib/utils";
import { GlassCard } from "../components/ui/GlassCard";
import { ShelfView } from "../components/collection/ShelfView";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLevel, currentXp, progressPercent, unlockedBadges, userStats } = useBadgeNotification();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetails>>({});
  const [topCollectors, setTopCollectors] = useState<any[]>([]);
  const [mostOwned, setMostOwned] = useState<any[]>([]);
  const [stats, setStats] = useState({ movies: 0, collectors: 0, reviews: 0 });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Films populaires
      const popularData = await getPopularMovies();
      setPopular(popularData);

      // Ma collection
      if (user) {
        const collection = await getPhysicalMovies(user.id);
        // Affiche l'ensemble de la collection (suppression du slice)
        setMyCollection(collection);

        // Détails des films
        // Attention : charger les détails pour une très grande collection peut être lourd
        // On le fait ici pour respecter la demande "ensemble de la collection"
        const details: Record<number, MovieDetails> = {};
        await Promise.all(
          collection.map(async (pm) => {
            try {
              // Vérification si on a déjà les détails pour éviter les appels redondants (optimisation simple)
              if (details[pm.tmdb_id]) return;

              const res = await fetch(
                `https://api.themoviedb.org/3/movie/${pm.tmdb_id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`,
              );
              if (res.ok) details[pm.tmdb_id] = await res.json();
            } catch {}
          }),
        );
        setMovieDetails(details);
      }

      // Top collectionneurs
      // On récupère aussi le prix pour calculer la valeur de la collection
      const { data: pmData } = await supabase.from("physical_movies").select("user_id, price");
      if (pmData) {
        const counts: Record<string, number> = {};
        const values: Record<string, number> = {};

        pmData.forEach((i) => {
          counts[i.user_id] = (counts[i.user_id] || 0) + 1;
          values[i.user_id] = (values[i.user_id] || 0) + (i.price || 0);
        });

        const top = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in(
            "id",
            top.map(([id]) => id),
          );

        setTopCollectors(
          top.map(([id, count], i) => ({
            id,
            count,
            totalValue: values[id],
            rank: i + 1,
            ...profiles?.find((p) => p.id === id),
          })),
        );
      }

      // Films les plus possédés
      const { data: allPm } = await supabase.from("physical_movies").select("tmdb_id");
      if (allPm) {
        const counts: Record<number, number> = {};
        allPm.forEach((i) => (counts[i.tmdb_id] = (counts[i.tmdb_id] || 0) + 1));
        const top5 = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const movies = await Promise.all(
          top5.map(async ([id, count], i) => {
            try {
              const res = await fetch(
                `https://api.themoviedb.org/3/movie/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`,
              );
              if (res.ok) {
                const m = await res.json();
                return { ...m, ownerCount: count, rank: i + 1 };
              }
            } catch {}
            return null;
          }),
        );
        setMostOwned(movies.filter(Boolean));
      }

      // Stats communauté
      const [{ count: totalMovies }, { data: users }, { count: totalReviews }] = await Promise.all([
        supabase.from("physical_movies").select("*", { count: "exact", head: true }),
        supabase.from("physical_movies").select("user_id"),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        movies: totalMovies || 0,
        collectors: new Set(users?.map((u) => u.user_id)).size,
        reviews: totalReviews || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const physicalCount = userStats?.physicalCount ?? 0;
  const watchedCount = userStats?.watchedIds?.size ?? 0;
  const favoritesCount = userStats?.favoriteIds?.size ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      {/* Le header mobile est maintenant géré globalement dans App.tsx */}

      <main className="md:pt-8 md:pb-8">
        {/* HERO - Non connectés */}
        {!user && (
          <section className="px-4 py-10 md:py-16 text-center">
            <div className="max-w-xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Votre vidéothèque<span className="text-amber-500"> mérite mieux</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Cataloguez vos DVD et Blu-ray, découvrez les collections de la communauté.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/auth")} className="bg-amber-500 hover:bg-amber-600">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer ma collection
                </Button>
                <Button variant="outline" onClick={() => navigate("/search")}>
                  Explorer
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* 1. DASHBOARD */}
        {user && (
          <section className="px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Bonjour, {user.email?.split("@")[0]}</h2>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* XP */}
                <div
                  onClick={() => navigate("/badges")}
                  className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15"
                >
                  <div className="flex items-center gap-2 text-amber-500 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium">Niveau {currentLevel}</span>
                  </div>
                  <p className="text-xl font-bold text-amber-500">{currentXp} XP</p>
                  <Progress value={progressPercent} className="h-1 mt-2" />
                </div>

                {/* Collection */}
                <div
                  onClick={() => navigate("/collection")}
                  className="p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-amber-500/30"
                >
                  <Library className="w-4 h-4 text-amber-500 mb-1" />
                  <p className="text-xl font-bold">{physicalCount}</p>
                  <p className="text-xs text-muted-foreground">Collection</p>
                </div>

                {/* Vus */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Eye className="w-4 h-4 text-emerald-500 mb-1" />
                  <p className="text-xl font-bold">{watchedCount}</p>
                  <p className="text-xs text-muted-foreground">Vus</p>
                </div>

                {/* Favoris */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Heart className="w-4 h-4 text-red-500 mb-1" />
                  <p className="text-xl font-bold">{favoritesCount}</p>
                  <p className="text-xs text-muted-foreground">Favoris</p>
                </div>

                {/* Badges */}
                <div
                  onClick={() => navigate("/badges")}
                  className="p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-amber-500/30"
                >
                  <Trophy className="w-4 h-4 text-amber-500 mb-1" />
                  <p className="text-xl font-bold">{unlockedBadges?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. MA COLLECTION */}
        {user && myCollection.length > 0 && (
          <section className="px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold">Ma Collection</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Votre collection complète</p>
                </div>
                <Link
                  to="/collection"
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full",
                    "text-sm font-medium",
                    "glass hover:bg-primary/10 hover:text-primary",
                    "transition-all duration-300",
                  )}
                >
                  Gérer
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Remplacement de la grille par la vue Étagère en mode "light" */}
              <ShelfView
                movies={myCollection}
                movieDetailsMap={movieDetails}
                onMovieClick={(pm) => navigate(`/movie/${pm.tmdb_id}`)}
                variant="light"
              />
            </div>
          </section>
        )}

        {/* 3. COLLECTIONS POPULAIRES */}
        {topCollectors.length > 0 && (
          <section className="px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Collections populaires</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {topCollectors.map((c) => (
                  <Link
                    key={c.id}
                    to={`/profile/${c.id}`}
                    className="p-3 rounded-xl bg-card border border-border text-center hover:border-amber-500/30 transition-colors group flex flex-col items-center justify-between min-h-[140px]"
                  >
                    <div className="flex flex-col items-center w-full">
                      <Avatar className="w-12 h-12 mb-3 group-hover:scale-110 transition-transform ring-2 ring-transparent group-hover:ring-amber-500/20">
                        <AvatarImage src={c.avatar_url} />
                        <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600 font-bold">
                          {(c.username || "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium truncate w-full group-hover:text-amber-500 transition-colors">
                        @{c.username || "user"}
                      </p>
                    </div>

                    <div className="w-full mt-3 space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md py-1">
                        <Disc className="w-3 h-3" />
                        <span>{c.count} films</span>
                      </div>

                      {c.totalValue > 0 && (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-600/90 bg-amber-500/10 rounded-md py-1">
                          <Coins className="w-3 h-3" />
                          <span>~{Math.round(c.totalValue)} €</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. FILMS LES PLUS COLLECTIONNÉS */}
        {mostOwned.length > 0 && (
          <section className="px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Les incontournables</h2>
                <p className="text-sm text-muted-foreground">Les films les plus présents dans les collections</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mostOwned.map((m) => (
                  <Link
                    key={m.id}
                    to={`/movie/${m.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-amber-500/30 transition-all group"
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-sm font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      {m.rank}
                    </span>
                    <div className="w-10 h-14 rounded overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                      {m.poster_path && (
                        <img
                          src={getImageUrl(m.poster_path, "w92") || ""}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-amber-500 transition-colors">
                        {m.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.release_date?.slice(0, 4)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                      <Library className="w-3 h-3" />
                      {m.ownerCount}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. ABONNEMENTS */}
        {user && (
          <div className="max-w-4xl mx-auto">
            <FollowingMoviesSection />
          </div>
        )}

        {/* 6. FILMS POPULAIRES */}
        <div className="max-w-4xl mx-auto">
          {/* Correction ici : suppression des props linkTo et linkLabel non supportées */}
          <MovieSection title="Films populaires" movies={popular} loading={loading} />
        </div>

        {/* 7. STATS COMMUNAUTÉ DÉTAILLÉES */}
        <section className="px-4 py-8 mt-8 mb-4">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="overflow-hidden relative">
              {/* Decorative background glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 p-2">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-display font-bold mb-2">La communauté CineVault</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                    Rejoignez des passionnés de cinéma physique qui préservent le patrimoine cinématographique, un
                    disque à la fois.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Item 1 */}
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3 text-amber-500">
                      <Disc className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {stats.movies.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-amber-500/80 uppercase tracking-wider mt-1">
                      Copies Physiques
                    </span>
                    <p className="text-xs text-muted-foreground mt-2 px-4">
                      Des éditions standards aux coffrets collectors rares catalogués par nos membres.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 text-blue-500">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {stats.collectors.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-blue-500/80 uppercase tracking-wider mt-1">
                      Collectionneurs
                    </span>
                    <p className="text-xs text-muted-foreground mt-2 px-4">
                      Une communauté active qui partage ses dernières acquisitions et découvertes.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 text-emerald-500">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {stats.reviews.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-emerald-500/80 uppercase tracking-wider mt-1">
                      Avis & Critiques
                    </span>
                    <p className="text-xs text-muted-foreground mt-2 px-4">
                      Des opinions authentiques sur la qualité des films et des éditions (image, son, bonus).
                    </p>
                  </div>
                </div>

                {!user && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={() => navigate("/auth")}
                      className="bg-amber-500 hover:bg-amber-600 rounded-full px-8"
                    >
                      Rejoindre l'aventure
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
