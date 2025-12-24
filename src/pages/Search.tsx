/**
 * CineVault - Search Page - Radical Minimalist Design
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, Film, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { UserCard } from "@/components/UserCard";
import { searchMovies, getPopularMovies, Movie } from "@/services/tmdb";
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
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES)));
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
      {/* Header */}
      <MinimalHeader />

      <main className="px-4 md:px-12 pt-20 md:pt-24 max-w-7xl mx-auto">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-display-xs md:text-display-sm text-white mb-6">SEARCH</h1>

          {/* Search Input - Minimal Style */}
          <div className="relative">
            <SearchIcon
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                isFocused ? "text-white" : "text-white/40",
              )}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search movies, users..."
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

          {/* Tabs */}
          {user && (
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
                Users
              </button>
            </div>
          )}
        </motion.div>

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
                Recent
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

        {/* Results */}
        {showResults && activeTab === "films" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-sm text-white/40 mb-4">
              {loadingMovies ? "Searching..." : `${movies.length} results`}
            </h3>

            {loadingMovies ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <MinimalMovieCardSkeleton key={i} />
                ))}
              </div>
            ) : movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {movies.map((movie, index) => (
                  <MinimalMovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No movies found</p>
              </div>
            )}
          </motion.div>
        )}

        {showResults && activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-sm text-white/40 mb-4">{loadingUsers ? "Searching..." : `${users.length} users`}</h3>

            {loadingUsers ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((userProfile) => (
                  <UserCard key={userProfile.id} user={userProfile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No users found</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Popular Movies */}
        {showPopular && activeTab === "films" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-sm text-white/40 mb-4">POPULAR</h3>

            {loadingInitial ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <MinimalMovieCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {popularMovies.slice(0, 18).map((movie, index) => (
                  <MinimalMovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      <FloatingDock />
    </div>
  );
}
