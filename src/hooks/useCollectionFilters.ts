import { useState, useMemo, useCallback } from "react";
import { 
  PhysicalMovie, 
  PhysicalFormat, 
  PhysicalCondition,
} from "@/services/physicalMovies";
import { MovieDetails } from "@/services/tmdb";

export interface CollectionFilters {
  search: string;
  formats: PhysicalFormat[];
  conditions: PhysicalCondition[];
  genres: string[];
  decades: string[];
  directors: string[];
  priceMin: number | null;
  priceMax: number | null;
}

const initialFilters: CollectionFilters = {
  search: "",
  formats: [],
  conditions: [],
  genres: [],
  decades: [],
  directors: [],
  priceMin: null,
  priceMax: null,
};

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

export const useCollectionFilters = (
  movies: PhysicalMovie[],
  movieDetailsMap: Record<number, ExtendedMovieDetails>
) => {
  const [filters, setFilters] = useState<CollectionFilters>(initialFilters);

  // Appliquer les filtres
  const filteredMovies = useMemo(() => {
    return movies.filter(pm => {
      const details = movieDetailsMap[pm.tmdb_id];

      // Recherche texte
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = details?.title?.toLowerCase().includes(searchLower);
        const directorMatch = details?.director?.toLowerCase().includes(searchLower);
        const notesMatch = pm.notes?.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !directorMatch && !notesMatch) {
          return false;
        }
      }

      // Filtre par format
      if (filters.formats.length > 0 && !filters.formats.includes(pm.format)) {
        return false;
      }

      // Filtre par condition
      if (filters.conditions.length > 0) {
        const condition = pm.condition || "good";
        if (!filters.conditions.includes(condition)) {
          return false;
        }
      }

      // Filtre par genre
      if (filters.genres.length > 0 && details?.genres) {
        const movieGenres = details.genres.map(g => g.name);
        const hasMatchingGenre = filters.genres.some(g => movieGenres.includes(g));
        if (!hasMatchingGenre) {
          return false;
        }
      }

      // Filtre par décennie
      if (filters.decades.length > 0 && details?.release_date) {
        const year = new Date(details.release_date).getFullYear();
        const decade = `${Math.floor(year / 10) * 10}s`;
        if (!filters.decades.includes(decade)) {
          return false;
        }
      }

      // Filtre par réalisateur
      if (filters.directors.length > 0 && details?.director) {
        if (!filters.directors.includes(details.director)) {
          return false;
        }
      }

      // Filtre par prix
      if (filters.priceMin !== null && (pm.price === null || pm.price < filters.priceMin)) {
        return false;
      }
      if (filters.priceMax !== null && (pm.price === null || pm.price > filters.priceMax)) {
        return false;
      }

      return true;
    });
  }, [movies, movieDetailsMap, filters]);

  // Extraire les options disponibles pour les filtres
  const filterOptions = useMemo(() => {
    const genres = new Set<string>();
    const decades = new Set<string>();
    const directors = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    movies.forEach(pm => {
      const details = movieDetailsMap[pm.tmdb_id];

      // Genres
      if (details?.genres) {
        details.genres.forEach(g => genres.add(g.name));
      }

      // Décennies
      if (details?.release_date) {
        const year = new Date(details.release_date).getFullYear();
        const decade = `${Math.floor(year / 10) * 10}s`;
        decades.add(decade);
      }

      // Réalisateurs
      if (details?.director) {
        directors.add(details.director);
      }

      // Prix
      if (pm.price !== null && pm.price > 0) {
        minPrice = Math.min(minPrice, pm.price);
        maxPrice = Math.max(maxPrice, pm.price);
      }
    });

    return {
      genres: Array.from(genres).sort(),
      decades: Array.from(decades).sort(),
      directors: Array.from(directors).sort(),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice || 100,
      },
    };
  }, [movies, movieDetailsMap]);

  // Actions de mise à jour des filtres
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const toggleFormat = useCallback((format: PhysicalFormat) => {
    setFilters(prev => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter(f => f !== format)
        : [...prev.formats, format],
    }));
  }, []);

  const toggleCondition = useCallback((condition: PhysicalCondition) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition],
    }));
  }, []);

  const toggleGenre = useCallback((genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
  }, []);

  const toggleDecade = useCallback((decade: string) => {
    setFilters(prev => ({
      ...prev,
      decades: prev.decades.includes(decade)
        ? prev.decades.filter(d => d !== decade)
        : [...prev.decades, decade],
    }));
  }, []);

  const toggleDirector = useCallback((director: string) => {
    setFilters(prev => ({
      ...prev,
      directors: prev.directors.includes(director)
        ? prev.directors.filter(d => d !== director)
        : [...prev.directors, director],
    }));
  }, []);

  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.formats.length > 0 ||
      filters.conditions.length > 0 ||
      filters.genres.length > 0 ||
      filters.decades.length > 0 ||
      filters.directors.length > 0 ||
      filters.priceMin !== null ||
      filters.priceMax !== null
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.formats.length;
    count += filters.conditions.length;
    count += filters.genres.length;
    count += filters.decades.length;
    count += filters.directors.length;
    if (filters.priceMin !== null || filters.priceMax !== null) count++;
    return count;
  }, [filters]);

  return {
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
  };
};
