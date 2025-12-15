import { supabase } from "@/integrations/supabase/client";
import { searchMovies, Movie } from "@/services/tmdb";

// ============================================
// Types
// ============================================

export interface BarcodeProduct {
  ean: string;
  title: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
}

export interface BarcodeLookupResult {
  success: boolean;
  product?: BarcodeProduct;
  movies?: Movie[];
  error?: string;
  source?: "cache" | "api" | "manual";
}

export interface CachedBarcode {
  ean: string;
  tmdb_id: number;
  title: string;
  created_at: string;
}

// ============================================
// Local Cache (IndexedDB)
// ============================================

const CACHE_DB_NAME = "cinevault_barcode_cache";
const CACHE_STORE_NAME = "ean_mappings";
const CACHE_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        const store = db.createObjectStore(CACHE_STORE_NAME, { keyPath: "ean" });
        store.createIndex("tmdb_id", "tmdb_id", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
      }
    };
  });

  return dbPromise;
};

export const getCachedMapping = async (ean: string): Promise<CachedBarcode | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CACHE_STORE_NAME, "readonly");
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.get(ean);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (error) {
    console.error("[BarcodeService] Cache read error:", error);
    return null;
  }
};

export const setCachedMapping = async (
  ean: string,
  tmdbId: number,
  title: string
): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CACHE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const data: CachedBarcode = {
        ean,
        tmdb_id: tmdbId,
        title,
        created_at: new Date().toISOString(),
      };
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("[BarcodeService] Cache write error:", error);
  }
};

export const clearBarcodeCache = async (): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CACHE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("[BarcodeService] Cache clear error:", error);
  }
};

// ============================================
// EAN Validation
// ============================================

export const isValidEAN = (code: string): boolean => {
  // Remove any spaces or dashes
  const cleaned = code.replace(/[\s-]/g, "");

  // Check if it's EAN-13, EAN-8, or UPC-A (12 digits)
  if (!/^\d{8}$|^\d{12}$|^\d{13}$/.test(cleaned)) {
    return false;
  }

  // Validate checksum for EAN-13
  if (cleaned.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleaned[12]);
  }

  // Validate checksum for UPC-A (12 digits)
  if (cleaned.length === 12) {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(cleaned[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleaned[11]);
  }

  // EAN-8 validation
  if (cleaned.length === 8) {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(cleaned[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleaned[7]);
  }

  return false;
};

export const normalizeEAN = (code: string): string => {
  const cleaned = code.replace(/[\s-]/g, "");

  // Convert UPC-A to EAN-13 by prepending 0
  if (cleaned.length === 12) {
    return "0" + cleaned;
  }

  return cleaned;
};

// ============================================
// Barcode Lookup via Edge Function
// ============================================

export const lookupBarcode = async (ean: string): Promise<BarcodeLookupResult> => {
  const normalizedEan = normalizeEAN(ean);

  // 1. Check local cache first
  const cached = await getCachedMapping(normalizedEan);
  if (cached) {
    console.log("[BarcodeService] Cache hit for EAN:", normalizedEan);
    const movies = await searchMovies(cached.title);
    const exactMatch = movies.find((m) => m.id === cached.tmdb_id);

    return {
      success: true,
      product: { ean: normalizedEan, title: cached.title },
      movies: exactMatch ? [exactMatch, ...movies.filter((m) => m.id !== cached.tmdb_id)] : movies,
      source: "cache",
    };
  }

  // 2. Call Edge Function for API lookup
  try {
    console.log("[BarcodeService] Looking up EAN via API:", normalizedEan);

    const { data, error } = await supabase.functions.invoke("barcode-lookup", {
      body: { ean: normalizedEan },
    });

    if (error) {
      console.error("[BarcodeService] Edge function error:", error);
      return {
        success: false,
        error: "Erreur lors de la recherche du code-barres",
      };
    }

    if (!data.success || !data.product) {
      return {
        success: false,
        error: data.error || "Produit non trouvé dans la base de données",
      };
    }

    // 3. Search TMDB with the product title
    const product: BarcodeProduct = data.product;
    const searchQuery = extractMovieTitle(product.title);
    const movies = await searchMovies(searchQuery);

    return {
      success: true,
      product,
      movies,
      source: "api",
    };
  } catch (error) {
    console.error("[BarcodeService] Lookup error:", error);
    return {
      success: false,
      error: "Erreur de connexion au service de codes-barres",
    };
  }
};

// ============================================
// Title Extraction Helpers
// ============================================

/**
 * Extract movie title from product name
 * DVD/Blu-ray products often have format info we need to strip
 */
export const extractMovieTitle = (productTitle: string): string => {
  let title = productTitle;

  // Remove common format indicators
  const formatPatterns = [
    /\s*[-–]\s*(DVD|Blu-?ray|4K|UHD|HD|BD|BR)\s*/gi,
    /\s*\((DVD|Blu-?ray|4K|UHD|HD|BD|BR)\)\s*/gi,
    /\s*\[(DVD|Blu-?ray|4K|UHD|HD|BD|BR)\]\s*/gi,
    /\s*(DVD|Blu-?ray|4K UHD|Ultra HD|HD DVD)\s*$/gi,
  ];

  formatPatterns.forEach((pattern) => {
    title = title.replace(pattern, " ");
  });

  // Remove edition indicators
  const editionPatterns = [
    /\s*[-–]\s*(Édition|Edition)\s+(Collector|Limitée|Spéciale|Steelbook|Prestige)\s*/gi,
    /\s*\((Édition|Edition)\s+(Collector|Limitée|Spéciale|Steelbook|Prestige)\)\s*/gi,
    /\s*(Collector|Limited|Special)\s+(Edition|Édition)\s*/gi,
    /\s*Steelbook\s*/gi,
    /\s*Coffret\s*/gi,
  ];

  editionPatterns.forEach((pattern) => {
    title = title.replace(pattern, " ");
  });

  // Remove disc count
  title = title.replace(/\s*\d+\s*(disques?|discs?)\s*/gi, " ");

  // Remove year in parentheses at the end (keep for search accuracy)
  // title = title.replace(/\s*\(\d{4}\)\s*$/, "");

  // Remove trailing/leading whitespace and multiple spaces
  title = title.replace(/\s+/g, " ").trim();

  return title;
};

/**
 * Detect format from product title
 */
export const detectFormatFromTitle = (
  title: string
): "dvd" | "bluray" | "4k" | "steelbook" | "collector" => {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("steelbook")) return "steelbook";
  if (lowerTitle.includes("collector") || lowerTitle.includes("coffret")) return "collector";
  if (lowerTitle.includes("4k") || lowerTitle.includes("uhd") || lowerTitle.includes("ultra hd"))
    return "4k";
  if (lowerTitle.includes("blu-ray") || lowerTitle.includes("bluray") || lowerTitle.includes("bd"))
    return "bluray";

  return "dvd";
};

// ============================================
// Batch Scanning Support
// ============================================

export interface ScanQueueItem {
  ean: string;
  status: "pending" | "processing" | "found" | "not_found" | "error";
  product?: BarcodeProduct;
  selectedMovie?: Movie;
  error?: string;
}

export const processScanQueue = async (
  queue: ScanQueueItem[],
  onProgress: (index: number, result: ScanQueueItem) => void
): Promise<ScanQueueItem[]> => {
  const results: ScanQueueItem[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];

    if (item.status !== "pending") {
      results.push(item);
      continue;
    }

    onProgress(i, { ...item, status: "processing" });

    const lookupResult = await lookupBarcode(item.ean);

    const updatedItem: ScanQueueItem = {
      ...item,
      status: lookupResult.success ? "found" : "not_found",
      product: lookupResult.product,
      error: lookupResult.error,
    };

    // Auto-select first movie if high confidence match
    if (lookupResult.movies && lookupResult.movies.length > 0) {
      const firstMovie = lookupResult.movies[0];
      // High confidence if title matches closely
      if (
        lookupResult.product &&
        firstMovie.title.toLowerCase().includes(extractMovieTitle(lookupResult.product.title).toLowerCase().slice(0, 10))
      ) {
        updatedItem.selectedMovie = firstMovie;
      }
    }

    results.push(updatedItem);
    onProgress(i, updatedItem);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
};
