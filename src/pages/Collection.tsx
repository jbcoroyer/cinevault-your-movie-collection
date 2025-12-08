import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { PhysicalMovieListItem } from "@/components/PhysicalMovieListItem";
import { PhysicalMoviePoster, PhysicalMoviePosterSkeleton } from "@/components/PhysicalMoviePoster";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { CollectionFiltersDrawer, ActiveFiltersBar } from "@/components/collection/CollectionFilters";
import { CollectionStats } from "@/components/collection/CollectionStats";
import { CollectionTimeline } from "@/components/collection/CollectionTimeline";
import { CollectionTopCreators } from "@/components/collection/CollectionTopCreators";
import { ShelfView } from "@/components/collection/ShelfView";
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
  Star,
  Trophy,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/EmptyState";

type ViewMode = "list" | "posters" | "shelf";
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

  // View & Sort state - "shelf" par défaut
  const [viewMode, setViewMode] = useState<ViewMode>("shelf");
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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
    <div className="min-h-dvh bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
              <Disc className="w-8 h-8 text-primary" />
              Ma Collection
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {physicalStats.totalMovies} film{physicalStats.totalMovies > 1 ? "s" : ""} physique
              {physicalStats.totalMovies > 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2 shadow-glow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>

        {/* Dashboard Widgets Row */}
        {physicalMovies.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Statistiques */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-300 shadow-sm group active:scale-95">
                  <div className="p-2.5 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center">Statistiques</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-background/50 backdrop-blur-sm z-10 shrink-0">
                  <DialogTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Statistiques de la collection
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[70vh] w-full bg-background/50">
                  <div className="p-6">
                    <CollectionStats
                      stats={physicalStats}
                      genreStats={genreStats}
                      decadeStats={decadeStats}
                      timelineStats={timelineStats}
                    />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* 2. Favoris (Top Creators) */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-300 shadow-sm group active:scale-95">
                  <div className="p-2.5 rounded-full bg-yellow-500/10 text-yellow-500 mb-2 group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center">Favoris</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-background/50 backdrop-blur-sm z-10 shrink-0">
                  <DialogTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Réalisateurs & Acteurs favoris
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[70vh] w-full bg-background/50">
                  <div className="p-6">
                    <CollectionTopCreators
                      directorStats={directorStats}
                      actorStats={actorStats}
                      onDirectorClick={(director) => {
                        handleDirectorClick(director);
                      }}
                    />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* 3. Timeline */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-300 shadow-sm group active:scale-95">
                  <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center">Timeline</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-background/50 backdrop-blur-sm z-10 shrink-0">
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Historique des achats
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[70vh] w-full bg-background/50">
                  <div className="p-6">
                    <CollectionTimeline
                      timelineStats={timelineStats}
                      movieDetailsMap={physicalMovieDetails}
                      onMovieClick={handleEdit}
                    />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-card p-4 rounded-lg border animate-pulse h-24" />
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <PhysicalMoviePosterSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : physicalMovies.length > 0 ? (
          <>
            {/* Search & Filters Bar */}
            <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md p-2 -mx-2 rounded-xl border border-border/50 shadow-sm space-y-3 mb-4">
              {/* Flex wrap pour mobile */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9 h-9 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="w-3 h-3" />
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
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-9 bg-muted/50 border-transparent">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" onClick={toggleSortOrder} className="h-9 w-9 flex-shrink-0">
                  {sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>

                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                {/* View Toggle */}
                <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-transparent">
                  <button
                    onClick={() => setViewMode("posters")}
                    className={cn(
                      "p-1.5 rounded-md transition-all active:scale-95",
                      viewMode === "posters"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Vue affiches"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md transition-all active:scale-95",
                      viewMode === "list"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("shelf")}
                    className={cn(
                      "p-1.5 rounded-md transition-all active:scale-95",
                      viewMode === "shelf"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Vue étagère"
                  >
                    <Library className="w-4 h-4" />
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
            <div className="flex justify-between items-end px-1">
              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground animate-fade-in">
                  {sortedMovies.length} résultat{sortedMovies.length > 1 ? "s" : ""}
                  {sortedMovies.length !== physicalMovies.length && ` sur ${physicalMovies.length}`}
                </p>
              )}
            </div>

            {/* Movies display */}
            {sortedMovies.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                description="Essayez de modifier vos filtres ou d'ajouter de nouveaux films."
                actionLabel="Réinitialiser les filtres"
                onAction={resetFilters}
              />
            ) : (
              <div className="min-h-[50vh]">
                {viewMode === "posters" && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 animate-fade-in">
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
                  <div className="space-y-2 animate-fade-in">
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

                {viewMode === "shelf" && (
                  <div className="animate-fade-in space-y-4">
                    <ShelfView movies={sortedMovies} movieDetailsMap={physicalMovieDetails} onMovieClick={handleEdit} />
                    <p className="text-center text-xs text-muted-foreground italic">
                      Survolez les tranches pour voir les détails.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Disc}
            title="Votre collection est vide"
            description="Commencez à ajouter vos DVD et Blu-ray pour construire votre vidéothèque numérique ultime."
            actionLabel="Ajouter mon premier film"
            onAction={() => setAddDialogOpen(true)}
            className="mt-12"
          />
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
