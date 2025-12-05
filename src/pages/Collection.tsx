import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { PhysicalMovieCard, PhysicalMovieCardSkeleton } from "@/components/PhysicalMovieCard";
import { PhysicalMovieListItem, PhysicalMovieListItemSkeleton } from "@/components/PhysicalMovieListItem";
import { PhysicalMoviePoster, PhysicalMoviePosterSkeleton } from "@/components/PhysicalMoviePoster";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, Movie, MovieDetails } from "@/services/tmdb";
import {
  getPhysicalMovies,
  getPhysicalMovieStats,
  PhysicalMovie,
} from "@/services/physicalMovies";
import { 
  Disc, 
  Plus, 
  Euro, 
  Package, 
  LayoutGrid, 
  List, 
  Image,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "cards" | "list" | "posters";
type SortBy = "title" | "year" | "price" | "genre" | "director" | "added";
type SortOrder = "asc" | "desc";

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

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

  // View & Sort state
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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
            const director = movieDetail.credits?.crew.find(c => c.job === "Director")?.name;
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

  // Sorted movies
  const sortedMovies = useMemo(() => {
    const movies = [...physicalMovies];
    
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
          const directorA = detailsA?.director || "";
          const directorB = detailsB?.director || "";
          comparison = directorA.localeCompare(directorB, "fr");
          break;
          
        case "added":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return movies;
  }, [physicalMovies, physicalMovieDetails, sortBy, sortOrder]);

  const physicalStats = getPhysicalMovieStats(physicalMovies);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  const sortLabels: Record<SortBy, string> = {
    title: "Titre",
    year: "Année",
    price: "Prix",
    genre: "Genre",
    director: "Réalisateur",
    added: "Date d'ajout",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky