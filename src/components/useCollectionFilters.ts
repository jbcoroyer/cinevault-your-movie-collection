/**
 * CineVault - useCollectionFilters Hook
 * 
 * Hook pour gérer les filtres de collection
 */

import { useState, useCallback, useMemo } from "react";
import { PhysicalFormat, PhysicalCondition } from "@/services/physicalMovies";

export interface CollectionFilters {
  formats: PhysicalFormat[];
  conditions: PhysicalCondition[];
  genres: string[];
  decades: string[];
  directors: string[];
  priceMin: number | null;
  priceMax: number | null;
  searchQuery: string;
}

export interface FilterOptions {
  genres: string[];
  decades: string[];
  directors: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

const initialFilters: CollectionFilters = {
  formats: [],
  conditions: [],
  genres: [],
  decades: [],
  directors: [],
  priceMin: null,
  priceMax: null,
  searchQuery: "",
};

const initialFilterOptions: FilterOptions = {
  genres: [],
  decades: [],
  directors: [],
  priceRange: { min: 0, max: 100 },
};

export function useCollectionFilters() {
  const [filters, setFilters] = useState<CollectionFilters>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);

  // Toggle format filter
  const toggleFormat = useCallback((format: PhysicalFormat) => {
    setFilters((prev) => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter((f) => f !== format)
        : [...prev.formats, format],
    }));
  }, []);

  // Toggle condition filter
  const toggleCondition = useCallback((condition: PhysicalCondition) => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  }, []);

  // Toggle genre filter
  const toggleGenre = useCallback((genre: string) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  }, []);

  // Toggle decade filter
  const toggleDecade = useCallback((decade: string) => {
    setFilters((prev) => ({
      ...prev,
      decades: prev.decades.includes(decade)
        ? prev.decades.filter((d) => d !== decade)
        : [...prev.decades, decade],
    }));
  }, []);

  // Toggle director filter
  const toggleDirector = useCallback((director: string) => {
    setFilters((prev) => ({
      ...prev,
      directors: prev.directors.includes(director)
        ? prev.directors.filter((d) => d !== director)
        : [...prev.directors, director],
    }));
  }, []);

  // Set price range
  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    setFilters((prev) => ({
      ...prev,
      priceMin: min,
      priceMax: max,
    }));
  }, []);

  // Set search query
  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Calculate if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.formats.length > 0 ||
      filters.conditions.length > 0 ||
      filters.genres.length > 0 ||
      filters.decades.length > 0 ||
      filters.directors.length > 0 ||
      filters.priceMin !== null ||
      filters.priceMax !== null
    );
  }, [filters]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.formats.length;
    count += filters.conditions.length;
    count += filters.genres.length;
    count += filters.decades.length;
    count += filters.directors.length;
    if (filters.priceMin !== null || filters.priceMax !== null) count += 1;
    return count;
  }, [filters]);

  return {
    filters,
    filterOptions,
    setFilterOptions,
    toggleFormat,
    toggleCondition,
    toggleGenre,
    toggleDecade,
    toggleDirector,
    setPriceRange,
    setSearchQuery,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
