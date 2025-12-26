import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Film,
  Calendar,
  TrendingUp,
  Star,
  Users,
  ExternalLink,
} from "lucide-react";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { FollowButton } from "@/components/FollowButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCompanyDetails,
  getCompanyMovies,
  getCompanyUpcomingMovies,
  getCompanyLogoUrl,
  CompanyDetails,
} from "@/services/tmdbCompanies";
import { Movie, getImageUrl } from "@/services/tmdb";
import { useAuth } from "@/contexts/AuthContext";

export default function StudioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  const [activeTab, setActiveTab] = useState("popular");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [companyData, moviesData, upcomingData] = await Promise.all([
          getCompanyDetails(parseInt(id)),
          getCompanyMovies(parseInt(id), 1, "popularity.desc"),
          getCompanyUpcomingMovies(parseInt(id)),
        ]);

        setCompany(companyData);
        setMovies(moviesData.results);
        setTotalPages(moviesData.total_pages);
        setUpcomingMovies(upcomingData);
      } catch (error) {
        console.error("Error fetching studio data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const loadMoreMovies = async () => {
    if (!id || loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getCompanyMovies(parseInt(id), nextPage, sortBy);
      setMovies((prev) => [...prev, ...data.results]);
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more movies:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSortChange = async (newSort: string) => {
    if (!id || newSort === sortBy) return;

    setSortBy(newSort);
    setPage(1);
    setLoading(true);

    try {
      const data = await getCompanyMovies(parseInt(id), 1, newSort);
      setMovies(data.results);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error("Error sorting movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = company ? getCompanyLogoUrl(company.logo_path, "w500") : null;

  // Loading state
  if (loading && !company) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-10 mb-12">
              <div className="w-32 md:w-64 lg:w-72">
                <div className="aspect-video bg-white/5 animate-pulse rounded-xl" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="h-10 bg-white/5 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-white/5 animate-pulse rounded w-1/2" />
                <div className="h-20 bg-white/5 animate-pulse rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <MinimalMovieCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-4">Studio non trouvé</p>
            <button
              onClick={() => navigate(-1)}
              className="text-white/70 hover:text-white transition-colors"
            >
              Retour
            </button>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Back button - mobile */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors md:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </motion.button>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-6 lg:gap-10 mb-12"
          >
            {/* Logo */}
            <div className="flex gap-4 md:flex-col md:w-64 lg:w-72">
              <div className="flex-shrink-0 w-32 md:w-full">
                {logoUrl ? (
                  <div className="aspect-video bg-white/10 rounded-xl p-6 flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <img
                      src={logoUrl}
                      alt={company.name}
                      className="max-w-full max-h-full object-contain filter brightness-0 invert"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-white/10">
                    <Building2 className="w-16 h-16 text-amber-400/50" />
                  </div>
                )}
              </div>

              {/* Follow button - mobile */}
              <div className="flex-1 md:hidden">
                <h1 className="text-2xl font-bold text-white mb-2">{company.name}</h1>
                {company.origin_country && (
                  <p className="text-sm text-white/50 mb-3">{company.origin_country}</p>
                )}
                <FollowButton
                  entityType="company"
                  entityId={company.id}
                  entityName={company.name}
                  entityImagePath={company.logo_path}
                  entityRole="studio"
                  showFollowersCount
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Desktop title */}
              <div className="hidden md:block mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      {company.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      {company.origin_country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {company.origin_country}
                        </span>
                      )}
                      {company.headquarters && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {company.headquarters}
                        </span>
                      )}
                    </div>
                  </div>
                  <FollowButton
                    entityType="company"
                    entityId={company.id}
                    entityName={company.name}
                    entityImagePath={company.logo_path}
                    entityRole="studio"
                    showFollowersCount
                  />
                </div>
              </div>

              {/* Description */}
              {company.description && (
                <p className="text-white/70 leading-relaxed mb-6">{company.description}</p>
              )}

              {/* Stats & Links */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white">{movies.length}+ films</span>
                </div>

                {upcomingMovies.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400">
                      {upcomingMovies.length} à venir
                    </span>
                  </div>
                )}

                {company.homepage && (
                  <a
                    href={company.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Site officiel</span>
                    <ExternalLink className="w-3 h-3 text-white/30" />
                  </a>
                )}
              </div>

              {/* Parent company */}
              {company.parent_company && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => navigate(`/studio/${company.parent_company!.id}`)}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                  >
                    <span>Filiale de</span>
                    <span className="text-amber-400">{company.parent_company.name}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="popular" className="data-[state=active]:bg-amber-500/20">
                <TrendingUp className="w-4 h-4 mr-2" />
                Populaires
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-amber-500/20">
                <Calendar className="w-4 h-4 mr-2" />
                Récents
              </TabsTrigger>
              <TabsTrigger value="top" className="data-[state=active]:bg-amber-500/20">
                <Star className="w-4 h-4 mr-2" />
                Mieux notés
              </TabsTrigger>
              {upcomingMovies.length > 0 && (
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-amber-500/20">
                  <Film className="w-4 h-4 mr-2" />
                  À venir ({upcomingMovies.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="popular">
              <MovieGrid
                movies={movies}
                loading={loading}
                onLoadMore={loadMoreMovies}
                loadingMore={loadingMore}
                hasMore={page < totalPages}
              />
            </TabsContent>

            <TabsContent value="recent">
              <MovieGrid
                movies={[...movies].sort((a, b) => {
                  const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
                  const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
                  return dateB - dateA;
                })}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="top">
              <MovieGrid
                movies={[...movies].sort((a, b) => b.vote_average - a.vote_average)}
                loading={loading}
              />
            </TabsContent>

            {upcomingMovies.length > 0 && (
              <TabsContent value="upcoming">
                <div className="mb-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Suivez ce studio pour être notifié des nouvelles sorties
                  </p>
                </div>
                <MovieGrid movies={upcomingMovies} loading={false} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}

// Composant grille de films
interface MovieGridProps {
  movies: Movie[];
  loading: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

function MovieGrid({ movies, loading, onLoadMore, loadingMore, hasMore }: MovieGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <MinimalMovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">Aucun film trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {movies.map((movie, index) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <MinimalMovieCard movie={movie} />
          </motion.div>
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="border-white/20 hover:bg-white/10"
          >
            {loadingMore ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Chargement...
              </>
            ) : (
              "Voir plus"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
