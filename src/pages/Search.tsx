/**
 * CineVault - Search Page
 *
 * Features:
 * - "Disponible pour moi" button (activates platform filters automatically)
 * - Advanced filters (genre, year, rating, runtime, platforms)
 * - AI-powered search
 * - User search tab
 * - Infinite scroll pagination
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
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { supabase } from "@/integrations/supabase/client";

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

interface PhysicalMovieSimple {
  tmdb_id: number;
  format: string;
}

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
  } catch {}
};

export default function Search() {
  const { user, profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<SearchTab>("films");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiFoundTitle, setAiFoundTitle] = useState<string | null>(null);

  const [availableForMeEnabled, setAvailableForMeEnabled] = useState(false);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovieSimple[]>([]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const userPlatforms = useMemo(() => profile?.streaming_services || [], [profile]);

  const physicalMoviesMap = useMemo(() => {
    const map = new Map<number, string[]>();
    physicalMovies.forEach((pm) => {
      const formats = map.get(pm.tmdb_id) || [];
      formats.push(pm.format);
      map.set(pm.tmdb_id, formats);
    });
    return map;
  }, [physicalMovies]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.genre !== null) count++;
    if (filters.yearMin > 1900 || filters.yearMax < currentYear) count++;
    if (filters.ratingMin > 0) count++;
    if (filters.runtimeMax < 300) count++;
    if (filters.platforms.length > 0) count++;
    return count;
  }, [filters]);

  const canUseAvailableForMe = user && userPlatforms.length > 0;

  const activePlatforms = useMemo(() => {
    if (availableForMeEnabled) return userPlatforms;
    return filters.platforms;
  }, [availableForMeEnabled, userPlatforms, filters.platforms]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [genresData, popular, usersData] = await Promise.all([
          getGenres(),
          getPopularMovies(),
          getPopularUsers(),
        ]);
        setGenres(genresData);
        setPopularMovies(popular);
        setPopularUsers(usersData);
        setRecentSearches(getRecentSearches());
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!user) {
      setPhysicalMovies([]);
      return;
    }
    const fetchPhysicalMovies = async () => {
      const { data, error } = await supabase.from("physical_movies").select("tmdb_id, format").eq("user_id", user.id);
      if (!error && data) setPhysicalMovies(data);
    };
    fetchPhysicalMovies();
  }, [user]);

  const buildDiscoverParams = useCallback(
    (page: number = 1): Record<string, string> => {
      const params: Record<string, string> = {
        sort_by: "popularity.desc",
        page: page.toString(),
      };

      if (filters.genre) params.with_genres = filters.genre.toString();
      if (filters.yearMin > 1900) params["primary_release_date.gte"] = `${filters.yearMin}-01-01`;
      if (filters.yearMax < currentYear) params["primary_release_date.lte"] = `${filters.yearMax}-12-31`;
      if (filters.ratingMin > 0) {
        params["vote_average.gte"] = filters.ratingMin.toString();
        params["vote_count.gte"] = "50";
      }
      if (filters.runtimeMax < 300) params["with_runtime.lte"] = filters.runtimeMax.toString();

      if (activePlatforms.length > 0) {
        const providerIds = activePlatforms.map((p) => STREAMING_PROVIDER_IDS[p]).filter(Boolean);
        if (providerIds.length > 0) {
          params.with_watch_providers = providerIds.join("|");
          params.watch_region = filters.region;
          params.with_watch_monetization_types = "flatrate";
        }
      }

      return params;
    },
    [filters, activePlatforms],
  );

  useEffect(() => {
    if (activeTab !== "films") return;

    setCurrentPage(1);
    setHasMore(true);

    const hasFilters = activeFiltersCount > 0 || availableForMeEnabled;

    if (!debouncedQuery.trim() && !hasFilters) {
      setMovies([]);
      setAiFoundTitle(null);
      return;
    }

    const search = async () => {
      setLoadingMovies(true);
      setAiFoundTitle(null);

      try {
        if (aiSearchEnabled && debouncedQuery.trim()) {
          setAiSearching(true);
          try {
            const aiResult = await searchMoviesByAI(debouncedQuery);
            if (aiResult.type === "specific" && aiResult.title) setAiFoundTitle(aiResult.title);
            setMovies(aiResult.movies);
            addRecentSearch(debouncedQuery);
            setAiSearching(false);
            setLoadingMovies(false);
            setHasMore(false);
            return;
          } catch (error) {
            console.error("AI search failed:", error);
            setAiSearching(false);
          }
        }

        if (debouncedQuery.trim()) {
          const results = await searchMovies(debouncedQuery);
          setMovies(results);
          addRecentSearch(debouncedQuery);
          setHasMore(false);
        } else if (hasFilters) {
          const params = buildDiscoverParams(1);
          const results = await discoverMovies(params);
          setMovies(results);
          setHasMore(results.length >= 20);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoadingMovies(false);
      }
    };

    search();
  }, [debouncedQuery, activeTab, activeFiltersCount, aiSearchEnabled, availableForMeEnabled, buildDiscoverParams]);

  const loadMoreMovies = useCallback(async () => {
    if (loadingMore || !hasMore || debouncedQuery.trim()) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = buildDiscoverParams(nextPage);
      const results = await discoverMovies(params);

      if (results.length === 0) {
        setHasMore(false);
      } else {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMovies = results.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMovies];
        });
        setCurrentPage(nextPage);
        setHasMore(results.length >= 20);
      }
    } catch (error) {
      console.error("Error loading more movies:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, debouncedQuery, buildDiscoverParams]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMovies && !loadingMore) {
          loadMoreMovies();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMovies, loadingMore, loadMoreMovies]);

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
    setAvailableForMeEnabled(false);
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
      setFilters((prev) => ({ ...prev, platforms: profile.streaming_services || [] }));
    }
  };

  const toggleAvailableForMe = () => {
    if (!canUseAvailableForMe) return;
    setAvailableForMeEnabled((prev) => {
      const newValue = !prev;
      if (newValue) setFilters((f) => ({ ...f, platforms: [] }));
      return newValue;
    });
  };

  const getAvailabilityForMovie = useCallback(
    (movieId: number): AvailabilityInfo[] | undefined => {
      const availability: AvailabilityInfo[] = [];

      const formats = physicalMoviesMap.get(movieId);
      if (formats) {
        formats.forEach((format) => availability.push({ type: "physical", name: format }));
      }

      if (availableForMeEnabled && activePlatforms.length > 0) {
        activePlatforms.forEach((platformId) => {
          const platform = STREAMING_PLATFORMS.find((p) => p.id === platformId);
          if (platform) availability.push({ type: "platform", name: platform.name });
        });
      }

      return availability.length > 0 ? availability : undefined;
    },
    [physicalMoviesMap, availableForMeEnabled, activePlatforms],
  );

  const showResults = debouncedQuery.trim().length > 0 || activeFiltersCount > 0 || availableForMeEnabled;
  const showRecentSearches = isFocused && !query && recentSearches.length > 0;
  const displayedMovies = showResults ? movies : popularMovies;

  return (
    <div className="min-h-screen bg-background pb-32">
      <MinimalHeader />

      <main className="px-4 md:px-12 pt-20 md:pt-24 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-display-xs md:text-display-sm text-white mb-4">RECHERCHE</h1>

          {user && (
            <div className="mb-4">
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
                          {physicalMovies.length > 0 && `${physicalMovies.length} DVD/Blu-ray • `}
                          {userPlatforms.length} plateforme{userPlatforms.length > 1 ? "s" : ""} (
                          {userPlatforms
                            .map((p) => STREAMING_PLATFORMS.find((sp) => sp.id === p)?.name || p)
                            .join(", ")}
                          )
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

          <div className="flex gap-2 items-start">
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
                  aiSearchEnabled
                    ? "Décrivez le film que vous cherchez..."
                    : availableForMeEnabled
                      ? "Rechercher dans mes plateformes..."
                      : "Rechercher films, utilisateurs..."
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className={cn(
                  "w-full bg-transparent border-0 border-b-2 py-3 pl-8 pr-10 text-lg text-white placeholder:text-white/30 focus:outline-none transition-colors",
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

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all relative",
                    activeFiltersCount > 0 || availableForMeEnabled
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "border-white/20 text-white/50 hover:text-white hover:border-white/40",
                  )}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {(activeFiltersCount > 0 || availableForMeEnabled) && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs text-black font-bold flex items-center justify-center">
                      {availableForMeEnabled ? userPlatforms.length : activeFiltersCount}
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
                  <div className="space-y-3">
                    <Label className="text-sm text-white/70 flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      Genre
                    </Label>
                    <Select
                      value={filters.genre?.toString() || "all"}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, genre: value === "all" ? null : parseInt(value) }))
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
                        onValueChange={([min, max]) => setFilters((prev) => ({ ...prev, yearMin: min, yearMax: max }))}
                        className="py-4"
                      />
                    </div>
                  </div>
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
                    {availableForMeEnabled && (
                      <p className="text-xs text-amber-400/80 bg-amber-500/10 px-3 py-2 rounded-lg">
                        "Disponible pour moi" est actif. Les plateformes de votre profil sont automatiquement
                        sélectionnées.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {STREAMING_PLATFORMS.map((platform) => {
                        const isSelected = availableForMeEnabled
                          ? userPlatforms.includes(platform.id)
                          : filters.platforms.includes(platform.id);
                        const isDisabled = availableForMeEnabled;
                        return (
                          <button
                            key={platform.id}
                            onClick={() => !isDisabled && togglePlatform(platform.id)}
                            disabled={isDisabled}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                              isSelected
                                ? "bg-white/10 border-white/30 text-white"
                                : "border-white/10 text-white/50 hover:border-white/20",
                              isDisabled && "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                            {platform.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {(filters.platforms.length > 0 || availableForMeEnabled) && (
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

        {(activeFiltersCount > 0 || availableForMeEnabled) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {availableForMeEnabled && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm flex items-center gap-2">
                <Eye className="w-3 h-3" />
                Disponible pour moi
                <button onClick={() => setAvailableForMeEnabled(false)} className="hover:text-amber-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
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
                  onClick={() => setFilters((prev) => ({ ...prev, yearMin: 1900, yearMax: currentYear }))}
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
            {!availableForMeEnabled &&
              filters.platforms.map((platformId) => {
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

        {(activeTab === "films" || availableForMeEnabled) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-sm text-white/40 mb-4">
              {loadingMovies || aiSearching
                ? "Recherche en cours..."
                : showResults
                  ? `${movies.length} résultat${movies.length > 1 ? "s" : ""}${hasMore ? "+" : ""}`
                  : "Films populaires"}
            </h3>

            {loadingMovies || aiSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : displayedMovies.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {displayedMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} availability={getAvailabilityForMovie(movie.id)} />
                  ))}
                </div>
                {hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {loadingMore ? (
                      <div className="flex items-center gap-2 text-white/50">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Chargement...</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={loadMoreMovies}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Charger plus
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={Film}
                title="Aucun résultat"
                description={
                  availableForMeEnabled
                    ? "Aucun film trouvé sur vos plateformes. Essayez de modifier les filtres."
                    : `Aucun film trouvé pour "${query}". Essayez d'autres termes.`
                }
                actionLabel="Effacer"
                onAction={handleClear}
              />
            )}
          </motion.div>
        )}

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
                {(debouncedQuery.trim() ? users : popularUsers).map((u) => (
                  <UserCard key={u.id} user={u} />
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
