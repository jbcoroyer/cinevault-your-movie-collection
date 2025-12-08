import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { PhysicalMovieListItem, PhysicalMovieListItemSkeleton } from "@/components/PhysicalMovieListItem";
import { PhysicalMoviePoster, PhysicalMoviePosterSkeleton } from "@/components/PhysicalMoviePoster";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { CollectionFiltersDrawer, ActiveFiltersBar } from "@/components/collection/CollectionFilters";
import { CollectionStats } from "@/components/collection/CollectionStats";
import { CollectionTimeline } from "@/components/collection/CollectionTimeline";
import { CollectionTopCreators } from "@/components/collection/CollectionTopCreators";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, Movie, MovieDetails } from "@/services/tmdb";
import {
  getPhysicalMovies,
  getPhysicalMovieStats,
  getGenreStats,
  getDecadeStats,
  getDirectorStats,
  getActorStats,
  getTimelineStats,
  getMultiEditions,
  PhysicalMovie,
} from "@/services/physicalMovies";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import {
  Disc,
  Plus,
  List,
  Image,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

// Type mis à jour sans "cards"
type ViewMode = "list" | "posters";
type SortBy = "title" | "year" | "price" | "genre" | "director" | "added" | "condition";
type SortOrder = "asc" | "desc";

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

const sortLabels: Record<SortBy, string> = {
  title: "Titre",
  year: "Année",
  price: "Prix",
  genre: "Genre",
  director: "Réalisateur",
  added: "Date d'ajout",
  condition: "État",
};

const conditionOrder = { mint: 1, very_good: 2, good: 3, acceptable: 4 };

export default function Collection() {
  const { user } = useAuth();
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, ExtendedMovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PhysicalMovie | null>(null);
  const [editingMovieDetails, setEditingMovieDetails] = useState<Movie | null>(null);

  // View & Sort state - "posters" par défaut
  const [viewMode, setViewMode] = useState<ViewMode>("posters");
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Section visibility - Stats repliées par défaut
  const [showStats, setShowStats] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTopCreators, setShowTopCreators] = useState(false);

  // Use collection filters hook
  const {
    filters,
    filteredMovies,
    filterOptions,
    setSearch,
    toggleFormat,
    toggleCondition,
    toggleGenre,
    toggleDecade,
    toggleDirector,
    setPriceRange,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useCollectionFilters(physicalMovies, physicalMovieDetails);

  const fetchPhysicalMovies = async () => {
    if (!user) return;

    setLoading(true);
    const data = await getPhysicalMovies(user.id);
    setPhysicalMovies(data);

    const details: Record<number, ExtendedMovieDetails> = {};
    await Promise.all(
      data.map(async (pm) => {
        try {
          if (!details[pm.tmdb_id]) {
            const movieDetail = await getMovieDetails(pm.tmdb_id);
            const director = movieDetail.credits?.crew.find((c) => c.job === "Director")?.name;
            details[pm.tmdb_id] = { ...movieDetail, director };
          }
        } catch (error) {
          console.error(`Error fetching movie ${pm.tmdb_id}:`, error);
        }
      }),
    );
    setPhysicalMovieDetails(details);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhysicalMovies();
  }, [user]);

  // Handle edit
  const handleEdit = (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => {
    setEditingMovie(physicalMovie);
    setEditingMovieDetails(movieDetails);
    setEditDialogOpen(true);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Calculate stats
  const physicalStats = useMemo(() => getPhysicalMovieStats(physicalMovies), [physicalMovies]);
  const genreStats = useMemo(
    () => getGenreStats(physicalMovies, physicalMovieDetails),
    [physicalMovies, physicalMovieDetails],
  );
  const decadeStats = useMemo(
    () => getDecadeStats(physicalMovies, physicalMovieDetails),
    [physicalMovies, physicalMovieDetails],
  );
  const directorStats = useMemo(
    () => getDirectorStats(physicalMovies, physicalMovieDetails),
    [physicalMovies, physicalMovieDetails],
  );
  const actorStats = useMemo(
    () => getActorStats(physicalMovies, physicalMovieDetails),
    [physicalMovies, physicalMovieDetails],
  );
  const timelineStats = useMemo(() => getTimelineStats(physicalMovies), [physicalMovies]);
  const multiEditions = useMemo(() => getMultiEditions(physicalMovies), [physicalMovies]);

  // Get edition count for a movie
  const getEditionCount = (tmdbId: number) => {
    const group = multiEditions.find((g) => g.tmdb_id === tmdbId);
    return group ? group.editions.length : 1;
  };

  // Sorted movies
  const sortedMovies = useMemo(() => {
    const movies = [...filteredMovies];

    movies.sort((a, b) => {
      const detailsA = physicalMovieDetails[a.tmdb_id];
      const detailsB = physicalMovieDetails[b.tmdb_id];

      let comparison = 0;

      switch (sortBy) {
        case "title":
          const titleA = detailsA?.title || "";
          const titleB = detailsB?.title || "";
          comparison = titleA.localeCompare(titleB, "fr");
          break;

        case "year":
          const yearA = detailsA?.release_date ? new Date(detailsA.release_date).getFullYear() : 0;
          const yearB = detailsB?.release_date ? new Date(detailsB.release_date).getFullYear() : 0;
          comparison = yearA - yearB;
          break;

        case "price":
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          comparison = priceA - priceB;
          break;

        case "genre":
          const genreA = detailsA?.genres?.[0]?.name || "";
          const genreB = detailsB?.genres?.[0]?.name || "";
          comparison = genreA.localeCompare(genreB, "fr");
          break;

        case "director":
          const dirA = detailsA?.director || "";
          const dirB = detailsB?.director || "";
          comparison = dirA.localeCompare(dirB, "fr");
          break;

        case "added":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;

        case "condition":
          const condA = conditionOrder[a.condition || "good"];
          const condB = conditionOrder[b.condition || "good"];
          comparison = condA - condB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return movies;
  }, [filteredMovies, physicalMovieDetails, sortBy, sortOrder]);

  // Handle director click from top creators
  const handleDirectorClick = (director: string) => {
    toggleDirector(director);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Disc className="w-6 h-6 text-primary" />
              Ma Collection
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {physicalStats.totalMovies} film{physicalStats.totalMovies > 1 ? "s" : ""} physique
              {physicalStats.totalMovies > 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-card p-4 rounded-lg border animate-pulse h-24" />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <PhysicalMoviePosterSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : physicalMovies.length > 0 ? (
          <>
            {/* Stats Section (Collapsible) */}
            <section>
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <BarChart3 className="w-4 h-4" />
                Statistiques
                {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showStats && (
                <CollectionStats
                  stats={physicalStats}
                  genreStats={genreStats}
                  decadeStats={decadeStats}
                  timelineStats={timelineStats}
                />
              )}
            </section>

            {/* Top Creators Section (Collapsible) */}
            {(directorStats.length > 0 || actorStats.length > 0) && (
              <section>
                <button
                  onClick={() => setShowTopCreators(!showTopCreators)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  Vos favoris
                  {showTopCreators ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTopCreators && (
                  <CollectionTopCreators
                    directorStats={directorStats}
                    actorStats={actorStats}
                    onDirectorClick={handleDirectorClick}
                  />
                )}
              </section>
            )}

            {/* Timeline Section (Collapsible) */}
            {timelineStats.length > 0 && (
              <section>
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <Calendar className="w-4 h-4" />
                  Timeline des achats
                  {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTimeline && (
                  <CollectionTimeline
                    timelineStats={timelineStats}
                    movieDetailsMap={physicalMovieDetails}
                    onMovieClick={handleEdit}
                  />
                )}
              </section>
            )}

            {/* Search & Filters Bar */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans ma collection..."
                    value={filters.search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filters Drawer Button */}
                <CollectionFiltersDrawer
                  filters={filters}
                  filterOptions={filterOptions}
                  toggleFormat={toggleFormat}
                  toggleCondition={toggleCondition}
                  toggleGenre={toggleGenre}
                  toggleDecade={toggleDecade}
                  toggleDirector={toggleDirector}
                  setPriceRange={setPriceRange}
                  resetFilters={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                  activeFilterCount={activeFilterCount}
                />

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="w-[130px]">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={toggleSortOrder} className="flex-shrink-0">
                  {sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>

                {/* View Toggle - Modifié pour n'avoir que Posters et List */}
                <div className="hidden sm:flex items-center bg-card rounded-lg p-1 border border-border">
                  <button
                    onClick={() => setViewMode("posters")}
                    className={cn(
                      "p-2 rounded transition-colors",
                      viewMode === "posters"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Vue affiches"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 rounded transition-colors",
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Filters Bar */}
              <ActiveFiltersBar
                filters={filters}
                toggleFormat={toggleFormat}
                toggleCondition={toggleCondition}
                toggleGenre={toggleGenre}
                toggleDecade={toggleDecade}
                toggleDirector={toggleDirector}
                setPriceRange={setPriceRange}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>

            {/* Results count */}
            {hasActiveFilters && (
              <p className="text-sm text-muted-foreground">
                {sortedMovies.length} résultat{sortedMovies.length > 1 ? "s" : ""}
                {sortedMovies.length !== physicalMovies.length && ` sur ${physicalMovies.length}`}
              </p>
            )}

            {/* Movies display */}
            {sortedMovies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun film ne correspond à vos critères</p>
                <Button variant="link" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <>
                {viewMode === "posters" && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                    {sortedMovies.map((pm) => (
                      <PhysicalMoviePoster
                        key={pm.id}
                        physicalMovie={pm}
                        movieDetails={physicalMovieDetails[pm.tmdb_id] || null}
                        onDeleted={fetchPhysicalMovies}
                        onEdit={handleEdit}
                        editionCount={getEditionCount(pm.tmdb_id)}
                      />
                    ))}
                  </div>
                )}

                {viewMode === "list" && (
                  <div className="space-y-3">
                    {sortedMovies.map((pm) => (
                      <PhysicalMovieListItem
                        key={pm.id}
                        physicalMovie={pm}
                        movieDetails={physicalMovieDetails[pm.tmdb_id] || null}
                        director={physicalMovieDetails[pm.tmdb_id]?.director}
                        onDeleted={fetchPhysicalMovies}
                        onEdit={handleEdit}
                        editionCount={getEditionCount(pm.tmdb_id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Disc className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center">Votre collection est vide</h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Commencez à ajouter vos DVD et Blu-ray pour garder une trace de tous les films que vous possédez.
            </p>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter mon premier film
            </Button>
          </div>
        )}
      </main>

      {/* Add Dialog */}
      <AddPhysicalMovieDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onMovieAdded={fetchPhysicalMovies} />

      {/* Edit Dialog */}
      <EditPhysicalMovieDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        physicalMovie={editingMovie}
        movieDetails={editingMovieDetails}
        onMovieUpdated={fetchPhysicalMovies}
      />

      <BottomNav />
    </div>
  );
}
