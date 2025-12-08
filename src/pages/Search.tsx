import { useState, useEffect } from "react";
import { Search as SearchIcon, X, Film, Users, SlidersHorizontal, Calendar, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { UserCard, UserCardSkeleton } from "@/components/UserCard";
import { EmptyState } from "@/components/EmptyState";
import { searchMovies, getGenres, getPopularMovies, discoverMovies, Movie, Genre } from "@/services/tmdb";
import { searchUsers, getPopularUsers, UserProfile } from "@/services/users";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Header } from "@/components/Header";

type SearchTab = "films" | "users";

interface Filters {
  genre: number | null;
  yearMin: number;
  yearMax: number;
  ratingMin: number;
  runtimeMax: number;
}

const currentYear = new Date().getFullYear();

export default function Search() {
  const [activeTab, setActiveTab] = useState<SearchTab>("films");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

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
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Users state
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState(false);

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
    setActiveFiltersCount(count);
  }, [filters]);

  // Search/filter movies
  useEffect(() => {
    if (activeTab !== "films") return;

    const searchAndFilter = async () => {
      setLoadingMovies(true);

      try {
        let results: Movie[] = [];

        if (debouncedQuery.trim()) {
          // Text search
          results = await searchMovies(debouncedQuery);
          setSearchedMovies(true);
        } else if (activeFiltersCount > 0 || filters.genre) {
          // Filter search using discover API
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

          results = await discoverMovies(params);
          setSearchedMovies(true);
        } else {
          // Show popular by default
          results = popularMovies;
          setSearchedMovies(false);
        }

        setMovieResults(results);
      } catch (error) {
        console.error("Error searching movies:", error);
      } finally {
        setLoadingMovies(false);
      }
    };

    searchAndFilter();
  }, [debouncedQuery, filters, activeTab, popularMovies, activeFiltersCount]);

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
  };

  const resetFilters = () => {
    setFilters({
      genre: null,
      yearMin: 1900,
      yearMax: currentYear,
      ratingMin: 0,
      runtimeMax: 300,
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
      return newState;
    });
  };

  const displayedMovies = searchedMovies || activeFiltersCount > 0 ? movieResults : popularMovies;

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
                  ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
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
                  ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Users className="w-4 h-4" />
              Utilisateurs
            </button>
          </div>

          {/* Search input */}
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={activeTab === "films" ? "Rechercher un film..." : "Rechercher un utilisateur..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10 h-11 bg-muted/30 border-transparent focus:border-primary/50 focus:bg-background transition-all"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters button - only for films */}
            {activeTab === "films" && (
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 relative flex-shrink-0 border-muted-foreground/20"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-background">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="font-serif text-2xl">Filtres</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-8 pb-20 px-1">
                    {/* Genre */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Film className="w-4 h-4 text-primary" />
                        Genre
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {genres.map((genre) => (
                          <button
                            key={genre.id}
                            onClick={() => setFilters((f) => ({ ...f, genre: f.genre === genre.id ? null : genre.id }))}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm transition-all border",
                              filters.genre === genre.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:border-primary/50",
                            )}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Year range */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Année de sortie
                      </Label>
                      <div className="flex items-center gap-4">
                        <Select
                          value={filters.yearMin.toString()}
                          onValueChange={(v) => setFilters((f) => ({ ...f, yearMin: parseInt(v) }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="De" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i)
                              .reverse()
                              .map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground font-medium">à</span>
                        <Select
                          value={filters.yearMax.toString()}
                          onValueChange={(v) => setFilters((f) => ({ ...f, yearMax: parseInt(v) }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="À" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i)
                              .reverse()
                              .map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Star className="w-4 h-4 text-primary" />
                          Note minimum
                        </Label>
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {filters.ratingMin > 0 ? `${filters.ratingMin}/10` : "Toutes"}
                        </span>
                      </div>
                      <Slider
                        value={[filters.ratingMin]}
                        onValueChange={([v]) => setFilters((f) => ({ ...f, ratingMin: v }))}
                        max={9}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>0</span>
                        <span>5</span>
                        <span>9+</span>
                      </div>
                    </div>

                    {/* Runtime */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          Durée maximum
                        </Label>
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {filters.runtimeMax < 300
                            ? `${Math.floor(filters.runtimeMax / 60)}h${filters.runtimeMax % 60 ? ` ${filters.runtimeMax % 60}m` : ""}`
                            : "Illimitée"}
                        </span>
                      </div>
                      <Slider
                        value={[filters.runtimeMax]}
                        onValueChange={([v]) => setFilters((f) => ({ ...f, runtimeMax: v }))}
                        min={60}
                        max={300}
                        step={15}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>1h</span>
                        <span>2h30</span>
                        <span>5h+</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
                    <Button variant="outline" onClick={resetFilters} className="flex-1">
                      Réinitialiser
                    </Button>
                    <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                      Voir les résultats
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Quick Filters Chips */}
          {activeTab === "films" && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 pb-1 max-w-4xl mx-auto items-center">
              {/* Active Filter Chips */}
              {filters.yearMin > 1900 && (
                <button
                  onClick={() => removeFilter("yearMin")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  Après {filters.yearMin}
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                </button>
              )}
              {filters.yearMax < currentYear && (
                <button
                  onClick={() => removeFilter("yearMax")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  Avant {filters.yearMax}
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                </button>
              )}
              {filters.ratingMin > 0 && (
                <button
                  onClick={() => removeFilter("ratingMin")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  {filters.ratingMin}+ <Star className="w-3 h-3 fill-current" />
                  <X className="w-3 h-3 opacity-70 group-hover:opacity-100 ml-1" />
                </button>
              )}
              {filters.runtimeMax < 300 && (
                <button
                  onClick={() => removeFilter("runtimeMax")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground animate-fade-in flex-shrink-0 group"
                >
                  &lt; {Math.floor(filters.runtimeMax / 60)}h{filters.runtimeMax % 60}
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
                // Don't show chip if already selected
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
              {!searchedMovies && activeFiltersCount === 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium">Films populaires</h2>
                </div>
              )}

              {loadingMovies ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <MovieCardSkeleton key={i} size="lg" />
                  ))}
                </div>
              ) : displayedMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {displayedMovies.map((movie, index) => (
                    <div key={movie.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                      <MovieCard movie={movie} size="lg" showInfo />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Film}
                  title="Aucun film trouvé"
                  description="Essayez de modifier vos termes de recherche ou vos filtres pour trouver ce que vous cherchez."
                  actionLabel={activeFiltersCount > 0 ? "Réinitialiser les filtres" : undefined}
                  onAction={activeFiltersCount > 0 ? resetFilters : undefined}
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
