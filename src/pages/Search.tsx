import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search as SearchIcon,
  X,
  Film,
  Users,
  SlidersHorizontal,
  Calendar,
  Clock,
  Star,
  Tv,
  Sparkles,
  Globe,
  Loader2,
  Disc,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton, AvailabilityInfo } from "@/components/MovieCard";
import { UserCard, UserCardSkeleton } from "@/components/UserCard";
import { EmptyState } from "@/components/EmptyState";
import {
  searchMovies,
  getGenres,
  getPopularMovies,
  discoverMovies,
  searchMoviesByAI,
  getUserCountryCode,
  STREAMING_PROVIDER_IDS,
  Movie,
  Genre,
} from "@/services/tmdb";
import { searchUsers, getPopularUsers, UserProfile } from "@/services/users";
import { useAuth } from "@/contexts/AuthContext";
import { useAvailableMovies } from "@/hooks/useAvailableMovies";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Header } from "@/components/Header";
import { toast } from "@/hooks/use-toast";

type SearchTab = "films" | "users";

const STREAMING_SERVICES = [
  { id: "netflix", name: "Netflix", color: "bg-red-600" },
  { id: "prime", name: "Prime Video", color: "bg-blue-500" },
  { id: "disney", name: "Disney+", color: "bg-indigo-600" },
  { id: "canal", name: "Canal+", color: "bg-gray-800" },
  { id: "apple", name: "Apple TV+", color: "bg-zinc-700" },
  { id: "max", name: "Max", color: "bg-purple-600" },
  { id: "paramount", name: "Paramount+", color: "bg-blue-700" },
  { id: "crunchyroll", name: "Crunchyroll", color: "bg-orange-500" },
];

const REGIONS = [
  { code: "FR", name: "France" },
  { code: "US", name: "États-Unis" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "CA", name: "Canada" },
  { code: "JP", name: "Japon" },
  { code: "KR", name: "Corée du Sud" },
  { code: "BR", name: "Brésil" },
];

interface Filters {
  genre: number | null;
  yearMin: number;
  yearMax: number;
  ratingMin: number;
  runtimeMax: number;
  platforms: string[];
  region: string;
}

const currentYear = new Date().getFullYear();

export default function Search() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<SearchTab>("films");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // "Disponible pour moi" toggle
  const [availableForMeEnabled, setAvailableForMeEnabled] = useState(false);

  // AI Search state
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchTitle, setAiSearchTitle] = useState<string | null>(null);

  // Films state
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [searchedMovies, setSearchedMovies] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    genre: null,
    yearMin: 1900,
    yearMax: currentYear,
    ratingMin: 0,
    runtimeMax: 300,
    platforms: [],
    region: "FR",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Users state
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState(false);

  // Hook pour les films disponibles
  const {
    movies: availableMoviesDefault,
    loading: loadingAvailable,
    userPlatforms,
    hasSubscriptions,
    hasCollection,
    physicalMoviesCount,
    getPhysicalAvailability,
    filterMoviesByAvailability,
  } = useAvailableMovies({
    enabled: availableForMeEnabled, // Sert à pré-charger la liste "par défaut" si activé
    additionalFilters: filters.genre ? { with_genres: filters.genre.toString() } : {},
  });

  // Map pour stocker les infos de disponibilité des films recherchés
  const [availabilityMap, setAvailabilityMap] = useState<Map<number, AvailabilityInfo[]>>(new Map());

  // Auto-detect user region on mount
  useEffect(() => {
    const detectRegion = async () => {
      try {
        const countryCode = await getUserCountryCode();
        setFilters((prev) => ({ ...prev, region: countryCode }));
      } catch (error) {
        console.error("Error detecting region:", error);
      }
    };
    detectRegion();
  }, []);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch genres and popular movies on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingMovies(true);
      try {
        const [genresData, popularData] = await Promise.all([getGenres(), getPopularMovies()]);
        setGenres(genresData);
        setPopularMovies(popularData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoadingMovies(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch popular users on mount
  useEffect(() => {
    const fetchPopularUsers = async () => {
      setLoadingUsers(true);
      const data = await getPopularUsers();
      setPopularUsers(data);
      setLoadingUsers(false);
    };
    fetchPopularUsers();
  }, []);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.genre) count++;
    if (filters.yearMin > 1900 || filters.yearMax < currentYear) count++;
    if (filters.ratingMin > 0) count++;
    if (filters.runtimeMax < 300) count++;
    if (filters.platforms.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Enrichir les films avec leur disponibilité physique quand "Disponible pour moi" est actif
  useEffect(() => {
    if (!availableForMeEnabled || !user) return;

    const enrichMovies = () => {
      const newMap = new Map<number, AvailabilityInfo[]>();

      // Pour chaque film affiché, vérifier la collection physique
      const moviesToCheck = searchedMovies ? movieResults : popularMovies;
      moviesToCheck.forEach((movie) => {
        const physical = getPhysicalAvailability(movie.id);
        if (physical.length > 0) {
          newMap.set(movie.id, physical);
        }
      });

      setAvailabilityMap(newMap);
    };

    enrichMovies();
  }, [availableForMeEnabled, user, movieResults, popularMovies, searchedMovies, getPhysicalAvailability]);

  // Main Search Logic
  useEffect(() => {
    if (activeTab !== "films") return;

    // Si on est en mode "Disponible pour moi" ET qu'il n'y a pas de recherche texte
    // on laisse le hook useAvailableMovies gérer le chargement initial (populaires disponibles)
    if (availableForMeEnabled && !debouncedQuery.trim() && activeFiltersCount === 0) {
      // On s'assure juste que le loading est cohérent
      setLoadingMovies(loadingAvailable);
      return;
    }

    const searchAndFilter = async () => {
      setLoadingMovies(true);
      setAiSearchTitle(null);

      try {
        let results: Movie[] = [];
        let isSearch = false;

        // 1. Récupération des résultats bruts (soit par recherche, soit filtres, soit populaires)
        if (debouncedQuery.trim()) {
          isSearch = true;
          if (aiSearchEnabled) {
            // AI Search
            setAiSearching(true);
            try {
              const aiResult = await searchMoviesByAI(debouncedQuery);
              results = aiResult.movies;
              if (aiResult.type === "specific" && aiResult.title) {
                setAiSearchTitle(aiResult.title);
              }
            } catch (error: any) {
              console.error("AI Search error:", error);
              toast({
                title: "Erreur de recherche IA",
                description: error.message || "Impossible d'analyser votre demande",
                variant: "destructive",
              });
              results = await searchMovies(debouncedQuery);
            } finally {
              setAiSearching(false);
            }
          } else {
            results = await searchMovies(debouncedQuery);
          }
        } else if (activeFiltersCount > 0 || filters.genre || filters.platforms.length > 0) {
          isSearch = true;
          const params: Record<string, string> = {
            sort_by: "popularity.desc",
            "vote_count.gte": "50",
          };

          if (filters.genre) params.with_genres = filters.genre.toString();
          if (filters.yearMin > 1900) params["primary_release_date.gte"] = `${filters.yearMin}-01-01`;
          if (filters.yearMax < currentYear) params["primary_release_date.lte"] = `${filters.yearMax}-12-31`;
          if (filters.ratingMin > 0) params["vote_average.gte"] = filters.ratingMin.toString();
          if (filters.runtimeMax < 300) params["with_runtime.lte"] = filters.runtimeMax.toString();

          if (filters.platforms.length > 0) {
            const providerIds = filters.platforms.map((p) => STREAMING_PROVIDER_IDS[p]).filter(Boolean);
            if (providerIds.length > 0) {
              params.watch_region = filters.region;
              params.with_watch_providers = providerIds.join("|");
              params.with_watch_monetization_types = "flatrate";
            }
          }

          results = await discoverMovies(params);
        } else {
          // Fallback aux populaires si rien n'est demandé
          results = popularMovies;
        }

        // 2. Filtrage "Disponible pour moi" si activé
        if (availableForMeEnabled) {
          const filteredResultsWithAvailability = await filterMoviesByAvailability(results);

          // Mettre à jour la map de disponibilité pour l'affichage des badges
          const newMap = new Map(availabilityMap);
          filteredResultsWithAvailability.forEach((item) => {
            newMap.set(item.movie.id, item.availability);
          });
          setAvailabilityMap(newMap);

          // Garder uniquement les films
          results = filteredResultsWithAvailability.map((item) => item.movie);

          // Si on est en mode "Disponible pour moi", on considère toujours que c'est une "recherche" filtrée
          // sauf si c'est la vue par défaut gérée ailleurs
          setSearchedMovies(true);
        } else {
          setSearchedMovies(isSearch);
        }

        setMovieResults(results);
      } catch (error) {
        console.error("Error searching movies:", error);
      } finally {
        setLoadingMovies(false);
      }
    };

    searchAndFilter();
  }, [
    debouncedQuery,
    filters,
    activeTab,
    popularMovies,
    activeFiltersCount,
    aiSearchEnabled,
    availableForMeEnabled,
    loadingAvailable, // Important pour re-trigger quand le hook a fini de charger ses données initiales
  ]);

  // Search users
  useEffect(() => {
    if (activeTab !== "users") return;

    const search = async () => {
      if (!debouncedQuery.trim()) {
        setUserResults([]);
        setSearchedUsers(false);
        return;
      }

      setLoadingUsers(true);
      const results = await searchUsers(debouncedQuery);
      setUserResults(results);
      setSearchedUsers(true);
      setLoadingUsers(false);
    };

    search();
  }, [debouncedQuery, activeTab]);

  const clearSearch = () => {
    setQuery("");
    setMovieResults([]);
    setUserResults([]);
    setSearchedMovies(false);
    setSearchedUsers(false);
    setAiSearchTitle(null);
  };

  const resetFilters = () => {
    setFilters({
      genre: null,
      yearMin: 1900,
      yearMax: currentYear,
      ratingMin: 0,
      runtimeMax: 300,
      platforms: [],
      region: "FR",
    });
  };

  const removeFilter = (key: keyof Filters) => {
    setFilters((prev) => {
      const newState = { ...prev };
      if (key === "genre") newState.genre = null;
      if (key === "yearMin") newState.yearMin = 1900;
      if (key === "yearMax") newState.yearMax = currentYear;
      if (key === "ratingMin") newState.ratingMin = 0;
      if (key === "runtimeMax") newState.runtimeMax = 300;
      if (key === "platforms") newState.platforms = [];
      return newState;
    });
  };

  const togglePlatform = (platformId: string) => {
    setFilters((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  const applyMyPlatforms = () => {
    if (profile?.streaming_services) {
      setFilters((prev) => ({
        ...prev,
        platforms: profile.streaming_services || [],
      }));
    }
  };

  // Déterminer les films à afficher
  const displayedMovies = useMemo(() => {
    if (availableForMeEnabled) {
      // Si une recherche ou des filtres sont actifs, on utilise les résultats filtrés
      if (debouncedQuery.trim() || activeFiltersCount > 0) {
        return movieResults;
      }
      // Sinon on affiche la liste par défaut (populaires disponibles) chargée par le hook
      return availableMoviesDefault.map((am) => am.movie);
    }
    return searchedMovies || activeFiltersCount > 0 ? movieResults : popularMovies;
  }, [
    availableForMeEnabled,
    availableMoviesDefault,
    searchedMovies,
    activeFiltersCount,
    movieResults,
    popularMovies,
    debouncedQuery,
  ]);

  // Obtenir les infos de disponibilité pour un film
  const getAvailabilityForMovie = (movieId: number): AvailabilityInfo[] | undefined => {
    if (!availableForMeEnabled) return undefined;

    // 1. Chercher dans la map locale (prioritaire pour les résultats de recherche)
    if (availabilityMap.has(movieId)) {
      return availabilityMap.get(movieId);
    }

    // 2. Chercher dans les résultats par défaut
    const available = availableMoviesDefault.find((am) => am.movie.id === movieId);
    if (available) return available.availability;

    return undefined;
  };

  // Vérifier si l'utilisateur peut utiliser "Disponible pour moi"
  const canUseAvailableForMe = user && (hasSubscriptions || hasCollection);

  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        <Header />

        <div className="bg-background/80 backdrop-blur-lg border-b border-border/50 p-4 sm:p-6 sticky top-14 z-30">
          {/* Segmented Control Tabs */}
          <div className="flex p-1 bg-muted/50 rounded-xl mb-4 relative max-w-md mx-auto">
            <button
              onClick={() => {
                setActiveTab("films");
                clearSearch();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === "films"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Film className="w-4 h-4" />
              Films
            </button>
            <button
              onClick={() => {
                setActiveTab("users");
                clearSearch();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === "users"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Users className="w-4 h-4" />
              Utilisateurs
            </button>
          </div>

          {/* "Disponible pour moi" Toggle - Uniquement pour les utilisateurs connectés */}
          {activeTab === "films" && user && (
            <div className="max-w-2xl mx-auto mb-4">
              <button
                onClick={() => {
                  if (!canUseAvailableForMe) {
                    toast({
                      title: "Configurez vos préférences",
                      description:
                        "Ajoutez vos plateformes de streaming dans les paramètres ou commencez votre collection pour utiliser cette fonctionnalité.",
                    });
                    return;
                  }
                  setAvailableForMeEnabled(!availableForMeEnabled);
                  // On ne vide plus la recherche ici pour permettre de filtrer les résultats existants
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                  availableForMeEnabled
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                    : "border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      availableForMeEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Eye className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Disponible pour moi</span>
                      {availableForMeEnabled && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {hasCollection && hasSubscriptions
                        ? `${physicalMoviesCount} DVD/Blu-ray + ${userPlatforms.length} plateforme${userPlatforms.length > 1 ? "s" : ""}`
                        : hasCollection
                          ? `${physicalMoviesCount} DVD/Blu-ray dans ma collection`
                          : hasSubscriptions
                            ? `${userPlatforms.length} plateforme${userPlatforms.length > 1 ? "s" : ""} de streaming`
                            : "Configurez vos abonnements ou collection"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasCollection && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Disc className="w-3 h-3" />
                      <span className="text-xs font-medium">{physicalMoviesCount}</span>
                    </div>
                  )}
                  {hasSubscriptions && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Tv className="w-3 h-3" />
                      <span className="text-xs font-medium">{userPlatforms.length}</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Search bar - Toujours visible maintenant */}
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              {aiSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
              ) : aiSearchEnabled ? (
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              ) : (
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              )}
              <Input
                ref={inputRef}
                type="text"
                placeholder={
                  activeTab === "films"
                    ? aiSearchEnabled
                      ? "Décrivez le film que vous cherchez..."
                      : availableForMeEnabled
                        ? "Rechercher dans mes films disponibles..."
                        : "Rechercher un film..."
                    : "Rechercher un utilisateur..."
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn(
                  "pl-11 pr-10 h-12 bg-card border-border/50 focus:border-primary/50 transition-all",
                  aiSearchEnabled && "border-primary/30 bg-primary/5",
                  availableForMeEnabled && "border-primary/30",
                )}
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* AI Search Toggle (Films only) */}
            {activeTab === "films" && (
              <Button
                variant={aiSearchEnabled ? "default" : "outline"}
                size="icon"
                className={cn("h-12 w-12 shrink-0", aiSearchEnabled && "bg-primary text-primary-foreground")}
                onClick={() => setAiSearchEnabled(!aiSearchEnabled)}
                title={aiSearchEnabled ? "Désactiver la recherche IA" : "Activer la recherche IA"}
              >
                <Sparkles className="w-5 h-5" />
              </Button>
            )}

            {/* Filters button (Films only) */}
            {activeTab === "films" && (
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative h-12 w-12 shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5" />
                      Filtres de recherche
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* Streaming Platforms (Only visible if NOT in "available for me" mode to avoid confusion) */}
                    {!availableForMeEnabled && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2 text-base font-semibold">
                            <Tv className="w-4 h-4" />
                            Plateformes
                          </Label>
                          {profile?.streaming_services && profile.streaming_services.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={applyMyPlatforms} className="text-xs h-7">
                              Mes abonnements
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {STREAMING_SERVICES.map((service) => {
                            const isSelected = filters.platforms.includes(service.id);
                            return (
                              <button
                                key={service.id}
                                onClick={() => togglePlatform(service.id)}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium",
                                  isSelected
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-border/50 bg-card/50 text-muted-foreground hover:border-border hover:bg-card",
                                )}
                              >
                                <span className={cn("w-2 h-2 rounded-full", service.color)} />
                                {service.name}
                              </button>
                            );
                          })}
                        </div>

                        {/* Region selector */}
                        {filters.platforms.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <Select
                              value={filters.region}
                              onValueChange={(value) => setFilters((prev) => ({ ...prev, region: value }))}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Région" />
                              </SelectTrigger>
                              <SelectContent>
                                {REGIONS.map((region) => (
                                  <SelectItem key={region.code} value={region.code}>
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Genre */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        Genre
                      </Label>
                      <Select
                        value={filters.genre?.toString() || "all"}
                        onValueChange={(value) =>
                          setFilters((f) => ({ ...f, genre: value === "all" ? null : parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les genres" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les genres</SelectItem>
                          {genres.map((genre) => (
                            <SelectItem key={genre.id} value={genre.id.toString()}>
                              {genre.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Year Range */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Période : {filters.yearMin} - {filters.yearMax}
                      </Label>
                      <div className="flex gap-4 items-center">
                        <Input
                          type="number"
                          min={1900}
                          max={currentYear}
                          value={filters.yearMin}
                          onChange={(e) => setFilters((f) => ({ ...f, yearMin: parseInt(e.target.value) || 1900 }))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">à</span>
                        <Input
                          type="number"
                          min={1900}
                          max={currentYear}
                          value={filters.yearMax}
                          onChange={(e) =>
                            setFilters((f) => ({ ...f, yearMax: parseInt(e.target.value) || currentYear }))
                          }
                          className="w-24"
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Note minimum : {filters.ratingMin}/10
                      </Label>
                      <Slider
                        value={[filters.ratingMin]}
                        onValueChange={([value]) => setFilters((f) => ({ ...f, ratingMin: value }))}
                        max={10}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    {/* Runtime */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Durée max : {Math.floor(filters.runtimeMax / 60)}h{filters.runtimeMax % 60}
                      </Label>
                      <Slider
                        value={[filters.runtimeMax]}
                        onValueChange={([value]) => setFilters((f) => ({ ...f, runtimeMax: value }))}
                        min={60}
                        max={300}
                        step={15}
                        className="w-full"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={resetFilters} className="flex-1">
                        Réinitialiser
                      </Button>
                      <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* AI Search hint */}
          {activeTab === "films" && aiSearchEnabled && !query && (
            <p className="text-center text-sm text-muted-foreground mt-3 max-w-lg mx-auto animate-fade-in">
              💡 Décrivez le film : "le film avec le requin", "celui où le gars dit 'I'll be back'", "comédie française
              avec Dujardin"...
            </p>
          )}

          {/* AI Search result indicator */}
          {aiSearchTitle && (
            <div className="flex items-center justify-center gap-2 mt-3 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Film identifié : {aiSearchTitle}</span>
            </div>
          )}

          {/* Active filters chips & suggestions */}
          {activeTab === "films" && !availableForMeEnabled && (
            <div className="flex items-center gap-2 overflow-x-auto mt-4 pb-2 scrollbar-hide max-w-4xl mx-auto">
              {/* Active Filters Chips */}
              {filters.platforms.length > 0 && (
                <button
                  onClick={() => removeFilter("platforms")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  <Tv className="w-3 h-3" />
                  {filters.platforms.length} plateforme{filters.platforms.length > 1 ? "s" : ""}
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100 ml-1" />
                </button>
              )}
              {filters.ratingMin > 0 && (
                <button
                  onClick={() => removeFilter("ratingMin")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  <Star className="w-3 h-3" />
                  {filters.ratingMin}+
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100 ml-1" />
                </button>
              )}
              {(filters.yearMin > 1900 || filters.yearMax < currentYear) && (
                <button
                  onClick={() => {
                    removeFilter("yearMin");
                    removeFilter("yearMax");
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  {filters.yearMin}-{filters.yearMax}
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100 ml-1" />
                </button>
              )}
              {filters.runtimeMax < 300 && (
                <button
                  onClick={() => removeFilter("runtimeMax")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  <Clock className="w-3 h-3" />
                  &lt;{Math.floor(filters.runtimeMax / 60)}h{filters.runtimeMax % 60}
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100 ml-1" />
                </button>
              )}
              {filters.genre && (
                <button
                  onClick={() => removeFilter("genre")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  {genres.find((g) => g.id === filters.genre)?.name}
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100 ml-1" />
                </button>
              )}

              {/* Separator if active filters exist */}
              {activeFiltersCount > 0 && <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />}

              {/* Suggestions Chips */}
              {genres.slice(0, 10).map((genre) => {
                if (filters.genre === genre.id) return null;
                return (
                  <button
                    key={genre.id}
                    onClick={() => setFilters((f) => ({ ...f, genre: genre.id }))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-transparent hover:border-primary/30 hover:text-foreground hover:bg-card transition-all flex-shrink-0 whitespace-nowrap"
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <main className="p-4 sm:p-6 container mx-auto max-w-7xl">
          {activeTab === "films" ? (
            <>
              {/* Section title */}
              {!availableForMeEnabled && !searchedMovies && activeFiltersCount === 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium">Films populaires</h2>
                </div>
              )}

              {availableForMeEnabled && (
                <div className="mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium">
                    {debouncedQuery ? `Résultats disponibles pour "${debouncedQuery}"` : "À regarder ce soir"}
                  </h2>
                  <span className="text-sm text-muted-foreground ml-2">({displayedMovies.length} films)</span>
                </div>
              )}

              {loadingMovies || (availableForMeEnabled && loadingAvailable && !searchedMovies) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <MovieCardSkeleton key={i} size="lg" />
                  ))}
                </div>
              ) : displayedMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {displayedMovies.map((movie, index) => (
                    <div key={movie.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                      <MovieCard movie={movie} size="lg" showInfo availability={getAvailabilityForMovie(movie.id)} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={availableForMeEnabled ? Eye : Film}
                  title={availableForMeEnabled ? "Aucun film disponible" : "Aucun film trouvé"}
                  description={
                    availableForMeEnabled
                      ? debouncedQuery
                        ? `Le film "${debouncedQuery}" n'est pas disponible sur vos plateformes ou dans votre collection.`
                        : hasCollection || hasSubscriptions
                          ? "Votre collection est vide et aucun film n'est disponible sur vos plateformes de streaming."
                          : "Ajoutez des films à votre collection ou configurez vos abonnements streaming dans les paramètres."
                      : filters.platforms.length > 0
                        ? `Aucun film disponible sur les plateformes sélectionnées dans la région ${filters.region}. Essayez de modifier vos filtres.`
                        : "Essayez de modifier vos termes de recherche ou vos filtres pour trouver ce que vous cherchez."
                  }
                  actionLabel={
                    availableForMeEnabled
                      ? "Désactiver le filtre"
                      : activeFiltersCount > 0
                        ? "Réinitialiser les filtres"
                        : undefined
                  }
                  onAction={
                    availableForMeEnabled
                      ? () => setAvailableForMeEnabled(false)
                      : activeFiltersCount > 0
                        ? resetFilters
                        : undefined
                  }
                />
              )}
            </>
          ) : (
            // Users content
            <>
              {!searchedUsers && (
                <div className="mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium">Communauté active</h2>
                </div>
              )}

              {loadingUsers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <UserCardSkeleton key={i} />
                  ))}
                </div>
              ) : (searchedUsers ? userResults : popularUsers).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(searchedUsers ? userResults : popularUsers).map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Aucun utilisateur trouvé"
                  description={`Aucun utilisateur ne correspond à "${query}". Essayez un autre pseudo.`}
                  actionLabel="Effacer la recherche"
                  onAction={clearSearch}
                />
              )}
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </>
  );
}
