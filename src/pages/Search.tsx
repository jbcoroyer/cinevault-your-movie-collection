import { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  X,
  Film,
  Users,
  SlidersHorizontal,
  Calendar,
  Clock,
  Star,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { UserCard, UserCardSkeleton } from "@/components/UserCard";
import { searchMovies, getGenres, getPopularMovies, Movie, Genre } from "@/services/tmdb";
import { searchUsers, getPopularUsers, UserProfile } from "@/services/users";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

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

          const response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=c0cfa8d140fb26ff2a4b624502be9a95&language=fr-FR&${new URLSearchParams(params)}`,
          );
          const data = await response.json();
          results = data.results || [];
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

  const displayedMovies = searchedMovies || activeFiltersCount > 0 ? movieResults : popularMovies;

  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        <Header />

        <div className="bg-background/80 backdrop-blur-lg border-b border-border/50 p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setActiveTab("films");
                clearSearch();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all",
                activeTab === "films"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
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
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all",
                activeTab === "users"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <Users className="w-4 h-4" />
              Utilisateurs
            </button>
          </div>

          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={activeTab === "films" ? "Rechercher un film..." : "Rechercher un utilisateur..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
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

            {/* Filters button - only for films */}
            {activeTab === "films" && (
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative flex-shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="font-serif text-2xl">Filtres</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 pb-20">
                    {/* Genre */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        Genre
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {genres.map((genre) => (
                          <button
                            key={genre.id}
                            onClick={() => setFilters((f) => ({ ...f, genre: f.genre === genre.id ? null : genre.id }))}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm transition-all",
                              filters.genre === genre.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Year range */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Année de sortie
                      </Label>
                      <div className="flex items-center gap-4">
                        <Select
                          value={filters.yearMin.toString()}
                          onValueChange={(v) => setFilters((f) => ({ ...f, yearMin: parseInt(v) }))}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
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
                        <span className="text-muted-foreground">à</span>
                        <Select
                          value={filters.yearMax.toString()}
                          onValueChange={(v) => setFilters((f) => ({ ...f, yearMax: parseInt(v) }))}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
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
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Note minimum : {filters.ratingMin > 0 ? `${filters.ratingMin}/10` : "Toutes"}
                      </Label>
                      <Slider
                        value={[filters.ratingMin]}
                        onValueChange={([v]) => setFilters((f) => ({ ...f, ratingMin: v }))}
                        max={9}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Toutes</span>
                        <span>9+</span>
                      </div>
                    </div>

                    {/* Runtime */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Durée maximum : {filters.runtimeMax < 300 ? `${filters.runtimeMax} min` : "Toutes"}
                      </Label>
                      <Slider
                        value={[filters.runtimeMax]}
                        onValueChange={([v]) => setFilters((f) => ({ ...f, runtimeMax: v }))}
                        min={60}
                        max={300}
                        step={15}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1h</span>
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

          {/* Quick genre buttons */}
          {activeTab === "films" && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 pb-1">
              {genres.slice(0, 8).map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setFilters((f) => ({ ...f, genre: f.genre === genre.id ? null : genre.id }))}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all",
                    filters.genre === genre.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <main className="p-4 sm:p-6">
          {activeTab === "films" ? (
            <>
              {/* Section title */}
              {!searchedMovies && activeFiltersCount === 0 && (
                <div className="mb-4">
                  <p className="section-label mb-1">Découvrir</p>
                  <h2 className="font-serif text-xl sm:text-2xl font-medium">Films populaires</h2>
                </div>
              )}

              {loadingMovies ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <MovieCardSkeleton key={i} size="lg" />
                  ))}
                </div>
              ) : displayedMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayedMovies.map((movie, index) => (
                    <div key={movie.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                      <MovieCard movie={movie} size="lg" showInfo />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Aucun film trouvé</p>
                  {activeFiltersCount > 0 && (
                    <Button variant="link" onClick={resetFilters} className="mt-2">
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            // Users content
            <>
              {!searchedUsers && (
                <div className="mb-4">
                  <p className="section-label mb-1">Communauté</p>
                  <h2 className="font-serif text-xl sm:text-2xl font-medium">Utilisateurs actifs</h2>
                </div>
              )}

              {loadingUsers ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <UserCardSkeleton key={i} />
                  ))}
                </div>
              ) : (searchedUsers ? userResults : popularUsers).length > 0 ? (
                <div className="space-y-3">
                  {(searchedUsers ? userResults : popularUsers).map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </>
  );
}
