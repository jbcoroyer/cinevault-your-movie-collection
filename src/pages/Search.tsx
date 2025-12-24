/**
 * CineVault - Search Page - Radical Minimalist Design
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, Film, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MinimalMovieCard } from "@/components/MinimalMovieCard";
import { UserCard } from "@/components/UserCard";
import {
  searchMovies,
  getPopularMovies,
  Movie,
} from "@/services/tmdb";
import { searchUsers, UserProfile } from "@/services/users";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

type SearchTab = "films" | "users";

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
  
  const [activeTab, setActiveTab] = useState<SearchTab>("films");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isFocused, setIsFocused] = useState(false);
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const popular = await getPopularMovies();
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
    inputRef.current?.focus();
  };

  const showResults = debouncedQuery.trim().length > 0;
  const showRecentSearches = isFocused && !query && recentSearches.length > 0;
  const showPopular = !showResults && !loadingInitial;

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-heading-mobile md:text-heading-desktop font-bold text-foreground mb-6">
            Recherche
          </h1>

          {/* Search Input - Minimal Style */}
          <div className="relative">
            <SearchIcon className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
              isFocused ? "text-foreground" : "text-muted-foreground"
            )} />
            <input
              ref={inputRef}
              placeholder="Rechercher un film, une personne..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className={cn(
                "w-full pl-8 pr-8 py-3 bg-transparent border-0 border-b text-base",
                "border-border focus:border-foreground",
                "placeholder:text-muted-foreground",
                "outline-none transition-colors"
              )}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Recent searches */}
          <AnimatePresence>
            {showRecentSearches && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  <span>Récentes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <motion.button
                      key={search}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.05 } }}
                      onClick={() => handleRecentSearchClick(search)}
                      className="px-4 py-2 border border-border text-sm hover:border-foreground transition-colors min-h-[44px]"
                    >
                      {search}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs - Minimal */}
        <div className="flex gap-6 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("films")}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeTab === "films" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              Films
            </span>
            {activeTab === "films" && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeTab === "users" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </span>
            {activeTab === "users" && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "films" ? (
            <motion.div
              key="films"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Loading */}
              {loadingMovies && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-card animate-pulse rounded-lg md:rounded-xl" />
                  ))}
                </div>
              )}

              {/* Results */}
              {!loadingMovies && showResults && movies.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {movies.length} résultat{movies.length > 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
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
                        <MinimalMovieCard movie={movie} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {!loadingMovies && showResults && movies.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Aucun film trouvé</p>
                </motion.div>
              )}

              {/* Popular */}
              {showPopular && (
                <div>
                  <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-6">Tendances</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                    {popularMovies.slice(0, 16).map((movie, index) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.03 }
                        }}
                      >
                        <MinimalMovieCard movie={movie} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Initial loading */}
              {loadingInitial && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-card animate-pulse rounded-lg md:rounded-xl" />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Loading */}
              {loadingUsers && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-border animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-card" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-card rounded w-32" />
                        <div className="h-3 bg-card rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {!loadingUsers && showResults && users.length > 0 && (
                <div className="space-y-1">
                  {users.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.05 }
                      }}
                      className="border-b border-border"
                    >
                      <UserCard user={user} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* No results */}
              {!loadingUsers && showResults && users.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                </motion.div>
              )}

              {/* Default */}
              {!showResults && !loadingUsers && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">
                    Recherchez des utilisateurs
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
