import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { MovieSection } from "../components/MovieSection";
import { FollowingMoviesSection } from "../components/FollowingMoviesSection";
import { getPopularMovies, Movie, getImageUrl } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeNotification } from "../contexts/BadgeNotificationContext";
import { getPhysicalMovies, PhysicalMovie } from "../services/physicalMovies";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Trophy, UserPlus, Zap, Library, Heart, Eye, Disc, Users, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Page d'accueil - Version épurée
 *
 * Ordre: Dashboard → Ma Collection → Collections populaires →
 *        Films collectionnés → Abonnements → Films populaires → Stats
 */

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLevel, currentXp, nextLevelXp, progressPercent, unlockedBadges, userStats } = useBadgeNotification();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [movieDetails, setMovieDetails] = useState<Record<number, Movie>>({});
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
        setMyCollection(collection.slice(0, 6));

        // Détails des films
        const details: Record<number, Movie> = {};
        await Promise.all(
          collection.slice(0, 6).map(async (pm) => {
            try {
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
      const { data: pmData } = await supabase.from("physical_movies").select("user_id");
      if (pmData) {
        const counts: Record<string, number> = {};
        pmData.forEach((i) => (counts[i.user_id] = (counts[i.user_id] || 0) + 1));
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-20 md:pb-8">
        {/* HERO - Non connectés */}
        {!user && (
          <section className="px-4 py-16 text-center">
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Ma Collection</h2>
                <Link to="/collection" className="text-sm text-amber-500 flex items-center gap-1">
                  Voir tout <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {myCollection.map((pm) => {
                  const m = movieDetails[pm.tmdb_id];
                  return (
                    <Link key={pm.id} to={`/movie/${pm.tmdb_id}`} className="group">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted relative">
                        {m?.poster_path ? (
                          <img
                            src={getImageUrl(m.poster_path, "w300") || ""}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-medium rounded bg-black/70 text-white uppercase">
                          {pm.format}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-medium truncate">{m?.title}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3. COLLECTIONS POPULAIRES */}
        {topCollectors.length > 0 && (
          <section className="px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Collections populaires</h2>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {topCollectors.map((c) => (
                  <Link
                    key={c.id}
                    to={`/profile/${c.id}`}
                    className="p-3 rounded-xl bg-card border border-border text-center hover:border-amber-500/30"
                  >
                    <Avatar className="w-10 h-10 mx-auto mb-2">
                      <AvatarImage src={c.avatar_url} />
                      <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
                        {(c.username || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium truncate">@{c.username || "user"}</p>
                    <p className="text-[10px] text-muted-foreground">{c.count} films</p>
                    {c.rank <= 3 && <span className="text-xs">{c.rank === 1 ? "🥇" : c.rank === 2 ? "🥈" : "🥉"}</span>}
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
              <h2 className="text-lg font-semibold mb-4">Les plus collectionnés</h2>

              <div className="space-y-2">
                {mostOwned.map((m) => (
                  <Link
                    key={m.id}
                    to={`/movie/${m.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border hover:border-amber-500/30"
                  >
                    <span className="w-6 text-center font-bold text-sm">
                      {m.rank <= 3 ? ["🥇", "🥈", "🥉"][m.rank - 1] : m.rank}
                    </span>
                    <div className="w-8 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      {m.poster_path && (
                        <img
                          src={getImageUrl(m.poster_path, "w92") || ""}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.release_date?.slice(0, 4)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {m.ownerCount}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. ABONNEMENTS */}
        {user && <FollowingMoviesSection />}

        {/* 6. FILMS POPULAIRES */}
        <div className="max-w-4xl mx-auto">
          <MovieSection
            title="Films populaires"
            movies={popular}
            loading={loading}
            linkTo="/movies/popular"
            linkLabel="Voir tout"
          />
        </div>

        {/* 7. STATS COMMUNAUTÉ */}
        <section className="px-4 py-8 mt-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4 p-5 rounded-xl bg-card border border-border text-center">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-amber-500">{stats.movies.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Films</p>
              </div>
              <div className="border-x border-border">
                <p className="text-xl sm:text-2xl font-bold text-amber-500">{stats.collectors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Collectionneurs</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-amber-500">{stats.reviews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Non connectés */}
        {!user && (
          <section className="px-4 py-8">
            <div className="max-w-md mx-auto text-center p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Disc className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <p className="font-semibold mb-2">Prêt à commencer ?</p>
              <p className="text-sm text-muted-foreground mb-4">Rejoignez la communauté gratuitement.</p>
              <Button onClick={() => navigate("/auth")} className="bg-amber-500 hover:bg-amber-600">
                Créer mon compte
              </Button>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
