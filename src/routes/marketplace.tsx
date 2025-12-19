/**
 * CineVault - Marketplace Routes Configuration
 * 
 * À ajouter dans votre fichier de routes principal (App.tsx ou routes.tsx)
 * 
 * Ces routes gèrent tout le parcours marketplace:
 * - Navigation
 * - Annonces
 * - Panier / Checkout
 * - Vendeur
 * - Commandes
 */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load des pages marketplace pour optimiser le bundle
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Sell = lazy(() => import("@/pages/Sell"));
const CreateListing = lazy(() => import("@/pages/CreateListing"));
const Orders = lazy(() => import("@/pages/Orders"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background p-4">
    <div className="container mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Wrapper avec Suspense
const withSuspense = (Component: React.LazyExoticComponent<() => JSX.Element>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

/**
 * Routes du marketplace à fusionner avec vos routes existantes
 */
export const marketplaceRoutes: RouteObject[] = [
  // ============================================
  // PUBLIC - Marketplace
  // ============================================
  {
    path: "/marketplace",
    element: withSuspense(Marketplace),
  },
  {
    path: "/listing/:id",
    element: withSuspense(ListingDetail),
  },

  // ============================================
  // AUTHENTICATED - Panier & Checkout
  // ============================================
  {
    path: "/cart",
    element: withSuspense(Cart),
  },
  {
    path: "/checkout",
    element: withSuspense(Checkout),
  },

  // ============================================
  // AUTHENTICATED - Commandes acheteur
  // ============================================
  {
    path: "/orders",
    element: withSuspense(Orders),
  },
  {
    path: "/orders/:orderId",
    element: withSuspense(Orders),
  },

  // ============================================
  // SELLER - Espace vendeur
  // ============================================
  {
    path: "/sell",
    element: withSuspense(Sell),
  },
  {
    path: "/sell/new",
    element: withSuspense(CreateListing),
  },
  {
    path: "/sell/edit/:id",
    element: withSuspense(CreateListing), // Même composant, mode édition
  },
];

/**
 * Exemple d'intégration dans App.tsx:
 * 
 * import { marketplaceRoutes } from "./routes/marketplace";
 * 
 * const router = createBrowserRouter([
 *   // Vos routes existantes...
 *   { path: "/", element: <Home /> },
 *   { path: "/collection", element: <Collection /> },
 *   
 *   // Routes marketplace
 *   ...marketplaceRoutes,
 *   
 *   // 404
 *   { path: "*", element: <NotFound /> },
 * ]);
 */

// ============================================
// Types pour les query params
// ============================================

export interface MarketplaceSearchParams {
  q?: string;
  formats?: string; // comma-separated: "4k,bluray,steelbook"
  conditions?: string; // comma-separated: "mint,near_mint,very_good"
  minPrice?: string;
  maxPrice?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "relevance";
  page?: string;
}

export interface CheckoutSuccessParams {
  session_id?: string;
  order_id?: string;
}

// ============================================
// Navigation helpers
// ============================================

export const marketplaceUrls = {
  // Marketplace
  marketplace: "/marketplace",
  listing: (id: string) => `/listing/${id}`,
  
  // Cart & Checkout
  cart: "/cart",
  checkout: "/checkout",
  checkoutSuccess: (orderId: string) => `/orders/${orderId}?success=true`,
  
  // Orders
  orders: "/orders",
  orderDetail: (id: string) => `/orders/${id}`,
  
  // Seller
  sell: "/sell",
  createListing: "/sell/new",
  editListing: (id: string) => `/sell/edit/${id}`,
  
  // Seller profile (public)
  sellerProfile: (id: string) => `/seller/${id}`,
};

/**
 * Hook pour générer les URLs marketplace avec search params
 * 
 * Usage:
 * const urls = useMarketplaceUrls();
 * navigate(urls.marketplaceWithFilters({ formats: ['4k', 'bluray'], minPrice: 10 }));
 */
export const buildMarketplaceUrl = (params: Partial<MarketplaceSearchParams>): string => {
  const searchParams = new URLSearchParams();
  
  if (params.q) searchParams.set("q", params.q);
  if (params.formats) searchParams.set("formats", params.formats);
  if (params.conditions) searchParams.set("conditions", params.conditions);
  if (params.minPrice) searchParams.set("minPrice", params.minPrice);
  if (params.maxPrice) searchParams.set("maxPrice", params.maxPrice);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page) searchParams.set("page", params.page);
  
  const queryString = searchParams.toString();
  return queryString ? `/marketplace?${queryString}` : "/marketplace";
};
