/**
 * CineVault - Search Page
 *
 * Features:
 * - "Disponible pour moi" button (shows only movies available on user's platforms + physical collection)
 * - Advanced filters (genre, year, rating, runtime, platforms)
 * - AI-powered search
 * - User search tab
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Eye,
  Check,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { MovieCard, MovieCardSkeleton, AvailabilityInfo } from "@/components/MovieCard";
import { UserCard, UserCardSkeleton } from "@/components/UserCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  searchMovies,
  getGenres,
  getPopularMovies,
  discoverMovies,
  searchMoviesByAI,
  Movie,
  Genre,
  STREAMING_PROVIDER_IDS,
} from "@/services/tmdb";
import { searchUsers, getPopularUsers, UserProfile } from "@/services/users";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { useAvailableMovies } from "@/hooks/useAvailableMovies";

// ============================================
// Types
// ============================================
type SearchTab = "films" | "users";

interface Filters {
  genre: number | null;
  yearMin: number;
  yearMax: number;
  ratingMin: number;
  runtimeMax: number;
  platforms: string[];
  region: string;
}

// ============================================
// Constants
// ============================================
const currentYear = new Date().getFullYear();

const STREAMING_PLATFORMS = [
  { id: "netflix", name: "Netflix", color: "#E50914" },
  { id: "prime", name: "Prime Video", color: "#00A8E1" },
  { id: "disney", name: "Disney+", color: "#113CCF" },
  { id: "canal", name: "Canal+", color: "#1A1A1A" },
  { id: "apple", name: "Apple TV+", color: "#000000" },
  { id: "max", name: "Max", color: "#002BE7" },
  { id: "paramount", name: "Paramount+", color: "#0064FF" },
  { id: "crunchyroll", name: "Crunchyroll", color: "#F47521" },
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

const defaultFilters: Filters = {
  genre: null,
  yearMin: 1900,
  yearMax: currentYear,
  ratingMin: 0,
  runtimeMax: 300,
  platforms: [],
  region: "FR",
};

// ============================================
// Local Storage helpers
// ============================================
const RECENT_SEARCHES_KEY = "cinevault_recent_searches";

const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentSearch = (query: string) => {
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter((s) => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
};

// ============================================
// Component
// ============================================
export default function Search() {
  const { user, profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState<SearchTab>("films");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Filters state
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  // AI Search
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiFoundTitle, setAiFoundTitle] = useState<string | null>(null);

  // "Disponible pour moi" state
  const [availableForMeEnabled, setAvailableForMeEnabled] = useState(false);

  // Movies state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Hook for "Disponible pour moi"
  const {
    movies: availableMovies,
    loading: availableLoading,
    hasSubscriptions,
    hasCollection,
    physicalMoviesCount,
    userPlatforms,
    getPhysicalAvailability,
  } = useAvailableMovies({
    enabled: availableForMeEnabled,
    additionalFilters: filters.genre ? { with_genres: filters.genre.toString() } : {},
  });

  // ============================================
  // Computed values
  // ============================================
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.genre !== null) count++;
    if (filters.yearMin > 1900 || filters.yearMax < currentYear) count++;
    if (filters.ratingMin > 0) count++;
    if (filters.runtimeMax < 300) count++;
    if (filters.platforms.length > 0) count++;
    return count;
  }, [filters]);

  const canUseAvailableForMe = user && (hasSubscriptions || hasCollection);

  // ============================================
  // Effects
  // ============================================

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [genresData, popular, users] = await Promise.all([getGenres(), getPopularMovies(), getPopularUsers()]);
        setGenres(genresData);
        setPopularMovies(popular);
        setPopularUsers(users);
        setRecentSearches(getRecentSearches());
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, []);

  // Search movies
  useEffect(() => {
    if (activeTab !== "films" || availableForMeEnabled) return;

    if (!debouncedQuery.trim() && activeFiltersCount === 0) {
      setMovies([]);
      setAiFoundTitle(null);
      return;
    }

    const search = async () => {
      setLoadingMovies(true);
      setAiFoundTitle(null);

      try {
        // AI Search
        if (aiSearchEnabled && debouncedQuery.trim()) {
          setAiSearching(true);
          try {
            const aiResult = await searchMoviesByAI(debouncedQuery);
            if (aiResult.type === "specific" && aiResult.title) {
              setAiFoundTitle(aiResult.title);
            }
            setMovies(aiResult.movies);
            addRecentSearch(debouncedQuery);
            setAiSearching(false);
            setLoadingMovies(false);
            return;
          } catch (error) {
            console.error("AI search failed, falling back to classic search:", error);
            setAiSearching(false);
          }
        }

        // Classic search or discover with filters
        if (debouncedQuery.trim()) {
          const results = await searchMovies(debouncedQuery);
          setMovies(results);
          addRecentSearch(debouncedQuery);
        } else if (activeFiltersCount > 0) {
          // Build discover params
          const params: Record<string, string> = {
            sort_by: "popularity.desc",
            "vote_count.gte": "50",
          };

          if (filters.genre) {
            params.with_genres = filters.genre.toString();
          }
          if (filters.yearMin > 1900) {
            params["primary_release_date.gte"] = `${filters.yearMin}-01-01`;
          }
          if (filters.yearMax < currentYear) {
            params["primary_release_date.lte"] = `${filters.yearMax}-12-31`;
          }
          if (filters.ratingMin > 0) {
            params["vote_average.gte"] = filters.ratingMin.toString();
          }
          if (filters.runtimeMax < 300) {
            params["with_runtime.lte"] = filters.runtimeMax.toString();
          }
          if (filters.platforms.length > 0) {
            const providerIds = filters.platforms.map((p) => STREAMING_PROVIDER_IDS[p]).filter(Boolean);
            if (providerIds.length > 0) {
              params.with_watch_providers = providerIds.join("|");
              params.watch_region = filters.region;
              params.with_watch_monetization_types = "flatrate";
            }
          }

          const results = await discoverMovies(params);
          setMovies(results);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoadingMovies(false);
      }
    };

    search();
  }, [debouncedQuery, activeTab, activeFiltersCount, aiSearchEnabled, filters, availableForMeEnabled]);

  // Search users
  useEffect(() => {
    if (activeTab !== "users") return;

    if (!debouncedQuery.trim()) {
      setUsers([]);
      return;
    }

    const search = async () => {
      setLoadingUsers(true);
      try {
        const results = await searchUsers(debouncedQuery);
        setUsers(results);
      } catch (error) {
        console.error("User search error:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    search();
  }, [debouncedQuery, activeTab]);

  // ============================================
  // Handlers
  // ============================================
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery("");
    setMovies([]);
    setUsers([]);
    setAiFoundTitle(null);
    inputRef.current?.focus();
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
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

  const toggleAvailableForMe = () => {
    if (!canUseAvailableForMe) return;
    setAvailableForMeEnabled((prev) => !prev);
    // Reset search when toggling
    if (!availableForMeEnabled) {
      setQuery("");
      setMovies([]);
    }
  };

  // ============================================
  // Computed display values
  // ============================================
  const showResults = debouncedQuery.trim().length > 0 || activeFiltersCount > 0;
  const showRecentSearches = isFocused && !query && recentSearches.length > 0 && !availableForMeEnabled;
  const showPopular = !showResults && !loadingInitial && !availableForMeEnabled;

  const displayedMovies = useMemo(() => {
    if (availableForMeEnabled) {
      return availableMovies.map((am) => am.movie);
    }
    return showResults ? movies : popularMovies;
  }, [availableForMeEnabled, availableMovies, showResults, movies, popularMovies]);

  const getAvailabilityForMovie = useCallback(
    (movieId: number): AvailabilityInfo[] | undefined => {
      if (!availableForMeEnabled) return undefined;

      const available = availableMovies.find((am) => am.movie.id === movieId);
      if (available) return available.availability;

      return getPhysicalAvailability(movieId);
    },
    [availableForMeEnabled, availableMovies, getPhysicalAvailability],
  );

  // ============================================
  // Render
  // ============================================
  return (
    <div className="min-h-screen bg-background pb-32">
      <MinimalHeader />

      <main className="px-4 md:px-12 pt-20 md:pt-24 max-w-7xl mx-auto">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-display-xs md:text-display-sm text-white mb-4">RECHERCHE</h1>

          {/* "Disponible pour moi" Button */}
          {user && (
            <div className="mb-6">
              <button
                onClick={toggleAvailableForMe}
                disabled={!canUseAvailableForMe}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
                  availableForMeEnabled
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : canUseAvailableForMe
                      ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                      : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      availableForMeEnabled ? "bg-amber-500/30" : "bg-white/10",
                    )}
                  >
                    <Eye className={cn("w-5 h-5", availableForMeEnabled ? "text-amber-400" : "text-white/50")} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Disponible pour moi</p>
                    <p className="text-xs opacity-60">
                      {canUseAvailableForMe ? (
                        <>
                          {physicalMoviesCount} DVD/Blu-ray
                          {userPlatforms.length > 0 && ` • ${userPlatforms.length} plateformes`}
                        </>
                      ) : (
                        "Configurez vos plateformes dans les paramètres"
                      )}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                    availableForMeEnabled ? "bg-amber-500" : "bg-white/20",
                  )}
                >
                  {availableForMeEnabled && <Check className="w-4 h-4 text-black" />}
                </div>
              </button>
            </div>
          )}

          {/* Search Input & Filters Row */}
          {!availableForMeEnabled && (
            <div className="flex gap-2 items-start">
              {/* Search Input */}
              <div className="relative flex-1">
                <SearchIcon
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                    isFocused ? "text-white" : "text-white/40",
                  )}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    aiSearchEnabled ? "Décrivez le film que vous cherchez..." : "Rechercher films, utilisateurs..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  className={cn(
                    "w-full bg-transparent border-0 border-b-2 py-3 pl-8 pr-10",
                    "text-lg text-white placeholder:text-white/30",
                    "focus:outline-none transition-colors",
                    isFocused ? "border-white" : "border-white/20",
                  )}
                />
                {query && (
                  <button
                    onClick={handleClear}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* AI Search Toggle */}
              <button
                onClick={() => setAiSearchEnabled((prev) => !prev)}
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all",
                  aiSearchEnabled
                    ? "bg-purple-500/20 border-purple-500 text-purple-400"
                    : "border-white/20 text-white/50 hover:text-white hover:border-white/40",
                )}
                title="Recherche IA"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              {/* Filters Button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all relative",
                      activeFiltersCount > 0
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "border-white/20 text-white/50 hover:text-white hover:border-white/40",
                    )}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs text-black font-bold flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10"
                >
                  <SheetHeader>
                    <SheetTitle className="text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5" />
                      Filtres
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                    {/* Genre */}
                    <div className="space-y-3">
                      <Label className="text-sm text-white/70 flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        Genre
                      </Label>
                      <Select
                        value={filters.genre?.toString() || "all"}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            genre: value === "all" ? null : parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
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
                      <Label className="text-sm text-white/70 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Année ({filters.yearMin} - {filters.yearMax})
                      </Label>
                      <div className="px-2">
                        <Slider
                          value={[filters.yearMin, filters.yearMax]}
                          min={1900}
                          max={currentYear}
                          step={1}
                          onValueChange={([min, max]) =>
                            setFilters((prev) => ({
                              ...prev,
                              yearMin: min,
                              yearMax: max,
                            }))
                          }
                          className="py-4"
                        />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                      <Label className="text-sm text-white/70 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Note minimale ({filters.ratingMin}/10)
                      </Label>
                      <div className="px-2">
                        <Slider
                          value={[filters.ratingMin]}
                          min={0}
                          max={10}
                          step={0.5}
                          onValueChange={([value]) => setFilters((prev) => ({ ...prev, ratingMin: value }))}
                          className="py-4"
                        />
                      </div>
                    </div>

                    {/* Runtime */}
                    <div className="space-y-3">
                      <Label className="text-sm text-white/70 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Durée max ({filters.runtimeMax} min)
                      </Label>
                      <div className="px-2">
                        <Slider
                          value={[filters.runtimeMax]}
                          min={30}
                          max={300}
                          step={10}
                          onValueChange={([value]) => setFilters((prev) => ({ ...prev, runtimeMax: value }))}
                          className="py-4"
                        />
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-white/70 flex items-center gap-2">
                          <Tv className="w-4 h-4" />
                          Plateformes
                        </Label>
                        {profile?.streaming_services && profile.streaming_services.length > 0 && (
                          <button
                            onClick={applyMyPlatforms}
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            Mes abonnements
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {STREAMING_PLATFORMS.map((platform) => (
                          <button
                            key={platform.id}
                            onClick={() => togglePlatform(platform.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                              filters.platforms.includes(platform.id)
                                ? "bg-white/10 border-white/30 text-white"
                                : "border-white/10 text-white/50 hover:border-white/20",
                            )}
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                            {platform.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Region */}
                    {filters.platforms.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm text-white/70 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Région (catalogue)
                        </Label>
                        <Select
                          value={filters.region}
                          onValueChange={(value) => setFilters((prev) => ({ ...prev, region: value }))}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS.map((region) => (
                              <SelectItem key={region.code} value={region.code}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-white/40">Les catalogues varient selon les pays</p>
                      </div>
                    )}
                  </div>

                  <SheetFooter className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={() => setFiltersOpen(false)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      Appliquer
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Tabs */}
          {user && !availableForMeEnabled && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setActiveTab("films")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeTab === "films" ? "bg-white text-black" : "text-white/50 hover:text-white",
                )}
              >
                <Film className="w-4 h-4" />
                Films
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeTab === "users" ? "bg-white text-black" : "text-white/50 hover:text-white",
                )}
              >
                <Users className="w-4 h-4" />
                Utilisateurs
              </button>
            </div>
          )}
        </motion.div>

        {/* AI Search indicator */}
        {aiSearchEnabled && aiFoundTitle && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 text-purple-400"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Film identifié : "{aiFoundTitle}"</span>
          </motion.div>
        )}

        {/* Active Filters Pills */}
        {activeFiltersCount > 0 && !availableForMeEnabled && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.genre && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center gap-2">
                {genres.find((g) => g.id === filters.genre)?.name}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, genre: null }))}
                  className="hover:text-amber-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.yearMin > 1900 || filters.yearMax < currentYear) && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center gap-2">
                {filters.yearMin} - {filters.yearMax}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      yearMin: 1900,
                      yearMax: currentYear,
                    }))
                  }
                  className="hover:text-amber-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.ratingMin > 0 && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center gap-2">
                ≥ {filters.ratingMin}/10
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, ratingMin: 0 }))}
                  className="hover:text-amber-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.runtimeMax < 300 && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center gap-2">
                ≤ {filters.runtimeMax} min
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, runtimeMax: 300 }))}
                  className="hover:text-amber-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.platforms.map((platformId) => {
              const platform = STREAMING_PLATFORMS.find((p) => p.id === platformId);
              return (
                <span
                  key={platformId}
                  className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platform?.color }} />
                  {platform?.name}
                  <button onClick={() => togglePlatform(platformId)} className="hover:text-amber-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button onClick={resetFilters} className="px-3 py-1 text-white/50 hover:text-white text-sm underline">
              Tout effacer
            </button>
          </div>
        )}

        {/* "Disponible pour moi" Title */}
        {availableForMeEnabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <h2 className="text-xl font-medium text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />À regarder ce soir
              <span className="text-white/40 text-sm font-normal ml-2">{availableMovies.length} films</span>
            </h2>
            <p className="text-white/50 text-sm mt-1">Films de votre collection et plateformes</p>
          </motion.div>
        )}

        {/* Recent Searches */}
        <AnimatePresence>
          {showRecentSearches && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <h3 className="text-sm text-white/40 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recherches récentes
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => handleRecentSearchClick(search)}
                    className="px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results - Films */}
        {(activeTab === "films" || availableForMeEnabled) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Section title */}
            {!availableForMeEnabled && (
              <h3 className="text-sm text-white/40 mb-4">
                {loadingMovies || aiSearching
                  ? "Recherche en cours..."
                  : showResults
                    ? `${movies.length} résultats`
                    : "Films populaires"}
              </h3>
            )}

            {loadingMovies || aiSearching || availableLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : displayedMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {displayedMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} availability={getAvailabilityForMovie(movie.id)} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Film}
                title={availableForMeEnabled ? "Aucun film disponible" : "Aucun résultat"}
                description={
                  availableForMeEnabled
                    ? "Ajoutez des films à votre collection ou configurez vos plateformes dans les paramètres."
                    : `Aucun film trouvé pour "${query}". Essayez d'autres termes.`
                }
                actionLabel={availableForMeEnabled ? undefined : "Effacer"}
                onAction={availableForMeEnabled ? undefined : handleClear}
              />
            )}
          </motion.div>
        )}

        {/* Results - Users */}
        {activeTab === "users" && !availableForMeEnabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-sm text-white/40 mb-4">
              {loadingUsers
                ? "Recherche en cours..."
                : debouncedQuery.trim()
                  ? `${users.length} résultats`
                  : "Utilisateurs populaires"}
            </h3>

            {loadingUsers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            ) : (debouncedQuery.trim() ? users : popularUsers).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(debouncedQuery.trim() ? users : popularUsers).map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="Aucun utilisateur trouvé"
                description={`Aucun utilisateur ne correspond à "${query}".`}
                actionLabel="Effacer"
                onAction={handleClear}
              />
            )}
          </motion.div>
        )}
      </main>

      <FloatingDock />
    </div>
  );
}
