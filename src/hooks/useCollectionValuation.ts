/**
 * CineVault - useCollectionValuation Hook
 * 
 * Hook pour gérer la valorisation de la collection
 * avec cache, loading states et refresh automatique
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  CollectionValuation,
  MovieValuation,
  PriceData,
  calculateCollectionValuation,
  getSavedValuation,
  getCachedPricesBatch,
  lookupPricesBatch,
  formatPrice,
  eurosToCents,
} from "@/services/priceService";
import { PhysicalMovie } from "@/services/physicalMovies";
import { MovieDetails } from "@/services/tmdb";

// ============================================
// Types
// ============================================

interface UseCollectionValuationOptions {
  movies: PhysicalMovie[];
  movieDetails: Record<number, MovieDetails>;
  autoRefresh?: boolean;
  refreshInterval?: number; // en minutes
}

interface UseCollectionValuationReturn {
  valuation: CollectionValuation | null;
  moviePrices: Map<string, PriceData>;
  loading: boolean;
  refreshing: boolean;
  lastUpdated: Date | null;
  coverage: number;
  refresh: () => Promise<void>;
  getMovieValuation: (tmdbId: number, format: string) => MovieValuation | null;
  formatValue: (cents: number | null | undefined) => string;
}

// ============================================
// Hook
// ============================================

export function useCollectionValuation({
  movies,
  movieDetails,
  autoRefresh = false,
  refreshInterval = 60, // 1 heure par défaut
}: UseCollectionValuationOptions): UseCollectionValuationReturn {
  const { user } = useAuth();
  const [valuation, setValuation] = useState<CollectionValuation | null>(null);
  const [moviePrices, setMoviePrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Prepare movie data
  const movieData = useMemo(() => {
    return movies.map((m) => {
      const details = movieDetails[m.tmdb_id];
      return {
        tmdbId: m.tmdb_id,
        title: details?.title || `Film #${m.tmdb_id}`,
        format: m.format,
        posterPath: details?.poster_path,
        purchasePrice: m.price || undefined,
        releaseYear: details?.release_date
          ? new Date(details.release_date).getFullYear()
          : undefined,
      };
    });
  }, [movies, movieDetails]);

  // Calculate coverage
  const coverage = useMemo(() => {
    if (!valuation) return 0;
    const total = valuation.itemsWithPrice + valuation.itemsWithoutPrice;
    return total > 0 ? Math.round((valuation.itemsWithPrice / total) * 100) : 0;
  }, [valuation]);

  // Load saved valuation and cached prices on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Load saved valuation
        const saved = await getSavedValuation(user.id);
        if (saved) {
          setValuation(saved);
          setLastUpdated(new Date(saved.lastUpdated));
        }

        // Load cached prices
        if (movies.length > 0) {
          const items = movies.map((m) => ({
            tmdbId: m.tmdb_id,
            format: m.format,
          }));
          const cached = await getCachedPricesBatch(items);
          setMoviePrices(cached);
        }
      } catch (error) {
        console.error("[useCollectionValuation] Load error:", error);
      }

      setLoading(false);
    };

    loadInitialData();
  }, [user, movies.length]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!user || movies.length === 0 || refreshing) return;

    setRefreshing(true);

    try {
      // Calculate new valuation
      const newValuation = await calculateCollectionValuation(user.id, movieData);
      setValuation(newValuation);
      setLastUpdated(new Date());

      // Update prices map
      const items = movies.map((m) => ({
        tmdbId: m.tmdb_id,
        format: m.format,
      }));
      const prices = await getCachedPricesBatch(items);
      setMoviePrices(prices);
    } catch (error) {
      console.error("[useCollectionValuation] Refresh error:", error);
    }

    setRefreshing(false);
  }, [user, movies, movieData, refreshing]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const intervalMs = refreshInterval * 60 * 1000;
    const interval = setInterval(refresh, intervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh, user]);

  // Get valuation for a specific movie
  const getMovieValuation = useCallback(
    (tmdbId: number, format: string): MovieValuation | null => {
      const key = `${tmdbId}-${format}`;
      const price = moviePrices.get(key);
      const movie = movies.find((m) => m.tmdb_id === tmdbId && m.format === format);
      const details = movieDetails[tmdbId];

      if (!movie) return null;

      const purchaseCents = movie.price ? eurosToCents(movie.price) : undefined;
      let profitLoss: number | undefined;
      let profitLossPercent: number | undefined;

      if (purchaseCents && price) {
        profitLoss = price.median - purchaseCents;
        profitLossPercent = Math.round(((price.median - purchaseCents) / purchaseCents) * 100);
      }

      return {
        tmdbId,
        format,
        title: details?.title || `Film #${tmdbId}`,
        posterPath: details?.poster_path,
        purchasePrice: purchaseCents,
        marketPrice: price || undefined,
        profitLoss,
        profitLossPercent,
      };
    },
    [movies, movieDetails, moviePrices]
  );

  return {
    valuation,
    moviePrices,
    loading,
    refreshing,
    lastUpdated,
    coverage,
    refresh,
    getMovieValuation,
    formatValue: formatPrice,
  };
}

// ============================================
// useMoviePrice Hook (for single movie)
// ============================================

interface UseMoviePriceOptions {
  tmdbId: number;
  title: string;
  format: string;
  year?: number;
  autoFetch?: boolean;
}

interface UseMoviePriceReturn {
  price: PriceData | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export function useMoviePrice({
  tmdbId,
  title,
  format,
  year,
  autoFetch = true,
}: UseMoviePriceOptions): UseMoviePriceReturn {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = await getCachedPricesBatch([{ tmdbId, format }]);
      const key = `${tmdbId}-${format}`;
      
      if (cached.has(key)) {
        setPrice(cached.get(key)!);
        setLoading(false);
        return;
      }

      // Fetch from API
      const result = await lookupPricesBatch([{ tmdbId, title, format, year }]);
      
      if (result.has(key)) {
        setPrice(result.get(key)!);
      } else {
        setError("Prix non disponible");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }

    setLoading(false);
  }, [tmdbId, title, format, year]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  return { price, loading, error, fetch };
}
