/**
 * CineVault - App.tsx
 *
 * Utilise GamificationManager pour gérer toutes les notifications de gamification :
 * - Bonus quotidien
 * - Paliers de streak (7, 14, 30, 100, 365 jours)
 * - Badges
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BadgeNotificationProvider } from "./contexts/BadgeNotificationContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { MobileHeader } from "./components/MobileHeader";
import OnboardingWizard from "./components/OnboardingWizard";
import { GamificationManager } from "./components/gamification/GamificationManager";
import Marketplace from "@/pages/Marketplace";
import ListingDetail from "@/pages/ListingDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Sell from "@/pages/Sell";
import CreateListing from "@/pages/CreateListing";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MovieList from "./pages/MovieList";
import MovieDetail from "./pages/MovieDetail";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Collection from "./pages/Collection";
import Settings from "./pages/Settings";
import Badges from "./pages/Badges";
import Lists from "./pages/Lists";
import ListDetail from "./pages/ListDetail";
import PersonDetail from "./pages/PersonDetail";
import ForgotPassword from "./pages/ForgotPassword";
import Feed from "./pages/Feed";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ============================================
// App Layout Component
// ============================================
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  // État de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Vérification si l'utilisateur a besoin de passer par l'onboarding
  const needsOnboarding = user && (!profile?.username || profile.username.startsWith("User_"));

  if (needsOnboarding) {
    return <OnboardingWizard />;
  }

  // Application normale avec GamificationManager
  return <GamificationManager>{children}</GamificationManager>;
};

// ============================================
// Main App Component
// ============================================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <BadgeNotificationProvider>
              <AppLayout>
                <MobileHeader />
                <Routes>
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:orderId" element={<Orders />} />
                  <Route path="/sell" element={<Sell />} />
                  <Route path="/sell/new" element={<CreateListing />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/movies" element={<MovieList />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/person/:id" element={<PersonDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/badges" element={<Badges />} />
                  <Route path="/lists" element={<Lists />} />
                  <Route path="/lists/:id" element={<ListDetail />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </BadgeNotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
