/**
 * CineVault - Marketplace Routes Configuration
 * 
 * Routes à ajouter au router principal de l'application
 * 
 * Instructions:
 * 1. Importer les pages dans votre fichier router (ex: App.tsx ou router.tsx)
 * 2. Ajouter les routes dans votre configuration React Router
 */

// ============================================
// Imports à ajouter
// ============================================

/*
import Marketplace from "@/pages/Marketplace";
import ListingDetail from "@/pages/ListingDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Sell from "@/pages/Sell";
import CreateListing from "@/pages/CreateListing";
*/

// ============================================
// Routes à ajouter dans votre <Routes> ou router config
// ============================================

/*
// Marketplace public
<Route path="/marketplace" element={<Marketplace />} />
<Route path="/listing/:id" element={<ListingDetail />} />

// Panier & Checkout
<Route path="/cart" element={<Cart />} />
<Route path="/checkout" element={<Checkout />} />

// Commandes (protégé - nécessite auth)
<Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
<Route path="/orders/:orderId" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

// Vendeur (protégé - nécessite auth)
<Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
<Route path="/sell/new" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
<Route path="/listing/:id/edit" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
*/

// ============================================
// Exemple complet avec React Router v6
// ============================================

import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Layout avec navigation
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Votre Navbar ici */}
      <Outlet />
      {/* Votre Footer/TabBar ici */}
    </div>
  );
};

// Router configuration
export const marketplaceRoutes = [
  {
    path: "/marketplace",
    lazy: () => import("@/pages/Marketplace"),
  },
  {
    path: "/listing/:id",
    lazy: () => import("@/pages/ListingDetail"),
  },
  {
    path: "/cart",
    lazy: () => import("@/pages/Cart"),
  },
  {
    path: "/checkout",
    element: <ProtectedRoute><></></ProtectedRoute>, // Replace with lazy import
    lazy: () => import("@/pages/Checkout"),
  },
  {
    path: "/orders",
    element: <ProtectedRoute><></></ProtectedRoute>,
    lazy: () => import("@/pages/Orders"),
  },
  {
    path: "/orders/:orderId",
    element: <ProtectedRoute><></></ProtectedRoute>,
    lazy: () => import("@/pages/Orders"),
  },
  {
    path: "/sell",
    element: <ProtectedRoute><></></ProtectedRoute>,
    lazy: () => import("@/pages/Sell"),
  },
  {
    path: "/sell/new",
    element: <ProtectedRoute><></></ProtectedRoute>,
    lazy: () => import("@/pages/CreateListing"),
  },
];

// ============================================
// Navigation Links à ajouter
// ============================================

export const marketplaceNavItems = [
  { label: "Marketplace", path: "/marketplace", icon: "Store" },
  { label: "Panier", path: "/cart", icon: "ShoppingCart", badge: "cartCount" },
  { label: "Mes commandes", path: "/orders", icon: "Package", protected: true },
  { label: "Vendre", path: "/sell", icon: "Euro", protected: true },
];

// ============================================
// URL Success/Cancel pour Stripe
// ============================================

export const stripeUrls = {
  success: "/orders?payment=success",
  cancel: "/cart?payment=cancelled",
};
