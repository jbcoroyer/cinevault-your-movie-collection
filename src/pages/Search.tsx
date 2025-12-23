/**
 * CineVault - Search Page AMÉLIORÉE
 * 
 * AMÉLIORATIONS:
 * - Skeleton shimmer pendant le chargement
 * - Stagger animation sur les résultats
 * - Auto-complete instantané
 * - Suggestions intelligentes quand 0 résultat
 * - Micro-interactions sur les posters
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  X,
  Film,
  Users,
  SlidersHorizontal,
  Star,
  Sparkles,
  Loader2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { UserCard } from "@/components/UserCard";
import { AnimatedPage, ListStagger, StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import {
  searchMovies,
  getGenres,
  getPopularMovies,
  discoverMovies,
  Movie,
  Genre,
} from "@/services/tmdb";
import { searchUsers, getPopularUsers, UserProfile } from "@/services/users";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

type SearchTab = "films" | "users";

// Recent searches (stored in localStorage)
const RECENT_SEARCHES_KEY = "cinevault_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentSearch = (query: string) => {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter(s => s !== query);
  recent.unshift(query);
  localStorage.setItem(
    RECENT_SEARCHES_KEY, 
    JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES))
  );
};

export default function Search() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Search state
  const [activeTab, setActiveTab] = useState<SearchTab>("films");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isFocused, setIsFocused] = useState(false);
  
  // Results state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Loading states
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [genreList, popular] = await Promise.all([
          getGenres(),
          getPopularMovies(),
        ]);
        setGenres(genreList);
        setPopularMovies(popular);
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
    if (activeTab !== "films") return;

    if (!debouncedQuery.trim()) {
      setMovies([]);
      return;
    }

    const search = async () => {
      setLoadingMovies(true);
      try {
        const results = await searchMovies(debouncedQuery);
        setMovies(results);
        addRecentSearch(debouncedQuery);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoadingMovies(false);
      }
    };

    search();
  }, [debouncedQuery, activeTab]);

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

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
    setMovies([]);
    setUsers([]);
    inputRef.current?.focus();
  };

  // Display logic
  const showResults = debouncedQuery.trim().length > 0;
  const showRecentSearches = isFocused && !query && recentSearches.length > 0;
  const showPopular = !showResults && !loadingInitial;

  return (
    <AnimatedPage className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container mx-auto px-4 pt-4">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-display font-bold mb-4">Recherche</h1>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
              isFocused ? "text-amber-500" : "text-muted-foreground"
            )} />
            <Input
              ref={inputRef}
              placeholder="Rechercher un film, une personne..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className={cn(
                "pl-12 pr-12 h-12 rounded-xl text-base",
                "bg-muted/50 border-muted",
                "focus:bg-background focus:border-amber-500/50",
                "transition-all duration-300"
              )}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Recent searches dropdown */}
          <AnimatePresence>
            {showRecentSearches && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-3 bg-card rounded-xl border border-border shadow-lg"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Recherches récentes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <motion.button
                      key={search}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.05 } }}
                      onClick={() => handleRecentSearchClick(search)}
                      className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                    >
                      {search}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="films" className="gap-2">
              <Film className="w-4 h-4" />
              Films
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "films" ? (
            <motion.div
              key="films"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Loading state */}
              {loadingMovies && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <MovieCardSkeleton size="lg" />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Search results */}
              {!loadingMovies && showResults && movies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {movies.length} résultat{movies.length > 1 ? 's' : ''} pour "{debouncedQuery}"
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {movies.map((movie, index) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.03 }
                        }}
                      >
                        <MovieCard movie={movie} size="lg" showInfo />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {!loadingMovies && showResults && movies.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">Aucun film trouvé</h3>
                  <p className="text-muted-foreground mb-6">
                    Essayez avec d'autres termes de recherche
                  </p>
                  
                  {/* Suggestions */}
                  <div className="max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground mb-3">
                      Films populaires du moment :
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularMovies.slice(0, 5).map((movie) => (
                        <motion.button
                          key={movie.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setQuery(movie.title)}
                          className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                        >
                          {movie.title}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Popular movies when no search */}
              {showPopular && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-semibold">Tendances</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {popularMovies.slice(0, 10).map((movie, index) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.05 }
                        }}
                      >
                        <MovieCard movie={movie} size="lg" showInfo />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Initial loading */}
              {loadingInitial && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <MovieCardSkeleton key={i} size="lg" />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Loading state */}
              {loadingUsers && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-xl animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-muted-foreground/20" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted-foreground/20 rounded w-32" />
                        <div className="h-3 bg-muted-foreground/20 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User results */}
              {!loadingUsers && showResults && users.length > 0 && (
                <div className="space-y-3">
                  {users.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.05 }
                      }}
                    >
                      <UserCard user={user} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* No results */}
              {!loadingUsers && showResults && users.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez avec un autre nom d'utilisateur
                  </p>
                </motion.div>
              )}

              {/* Default state */}
              {!showResults && !loadingUsers && (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    Recherchez des utilisateurs pour les suivre
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </AnimatedPage>
  );
}
