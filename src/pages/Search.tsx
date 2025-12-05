import { useState, useEffect } from "react";
import { Search as SearchIcon, X, Film, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { UserCard, UserCardSkeleton } from "@/components/UserCard";
import { searchMovies, getGenres, discoverMoviesByGenre, Movie, Genre } from "@/services/tmdb";
import { searchUsers, getPopularUsers, UserProfile } from "@/services/users";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Header } from "@/components/Header";

type SearchTab = "films" | "users";

export default function Search() {
  const [activeTab, setActiveTab] = useState<SearchTab>("films");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Films state
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [searchedMovies, setSearchedMovies] = useState(false);

  // Users state
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState(false);

  // Fetch genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      const data = await getGenres();
      setGenres(data);
    };
    fetchGenres();
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

  // Search movies
  useEffect(() => {
    if (activeTab !== "films") return;

    const search = async () => {
      if (!debouncedQuery.trim()) {
        setMovieResults([]);
        setSearchedMovies(false);
        return;
      }

      setLoadingMovies(true);
      const results = await searchMovies(debouncedQuery);
      setMovieResults(results);
      setSearchedMovies(true);
      setLoadingMovies(false);
    };

    search();
  }, [debouncedQuery, activeTab]);

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

  // Filter by genre
  useEffect(() => {
    if (activeTab !== "films" || !selectedGenre) return;

    const fetchByGenre = async () => {
      setLoadingMovies(true);
      const results = await discoverMoviesByGenre(selectedGenre);
      setMovieResults(results);
      setSearchedMovies(true);
      setLoadingMovies(false);
    };

    fetchByGenre();
  }, [selectedGenre, activeTab]);

  const handleGenreSelect = (genreId: number) => {
    setQuery("");
    setSelectedGenre(selectedGenre === genreId ? null : genreId);
  };

  const clearSearch = () => {
    setQuery("");
    setSelectedGenre(null);
    setMovieResults([]);
    setUserResults([]);
    setSearchedMovies(false);
    setSearchedUsers(false);
  };

  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="bg-background/80 backdrop-blur-lg border-b border-border p-4">
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
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={activeTab === "films" ? "Rechercher un film..." : "Rechercher un utilisateur..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedGenre(null);
              }}
              className="pl-10 pr-10"
            />
            {(query || selectedGenre) && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Genre filters (only for films) */}
          {activeTab === "films" && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreSelect(genre.id)}
                  className={cn(
                    "px-4 py-2 rounded-button text-sm whitespace-nowrap transition-all",
                    selectedGenre === genre.id
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

        <main className="p-4">
          {activeTab === "films" ? (
            // Films content
            loadingMovies ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <MovieCardSkeleton key={i} size="lg" />
                ))}
              </div>
            ) : movieResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movieResults.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} size="lg" />
                ))}
              </div>
            ) : searchedMovies ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun film trouvé</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Film className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Recherchez un film ou sélectionnez un genre</p>
              </div>
            )
          ) : // Users content
          loadingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          ) : query && userResults.length > 0 ? (
            <div className="space-y-3">
              {userResults.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : query && searchedUsers ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            // Show popular users when no search
            <div>
              <h2 className="text-lg font-semibold mb-4">🔥 Utilisateurs populaires</h2>
              <div className="space-y-3">
                {popularUsers.length > 0 ? (
                  popularUsers.map((user) => <UserCard key={user.id} user={user} />)
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Aucun utilisateur pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </>
  );
}
