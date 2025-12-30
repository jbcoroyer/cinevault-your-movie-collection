/**
 * CineVault — Radical Minimalist App
 *
 * Force dark mode, minimal UI
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BadgeNotificationProvider } from "./contexts/BadgeNotificationContext";
import { AddMovieProvider, useAddMovie } from "./contexts/AddMovieContext";
import OnboardingWizard from "./components/OnboardingWizard";
import { GamificationManager } from "./components/gamification/GamificationManager";
import { XPToastProvider } from "./components/gamification/XPToast";
import { AddMovieSheet } from "./components/AddMovieSheet";
import PublicCollection from "@/pages/PublicCollection";
import { useEffect, useCallback } from "react";
import StudioDetail from "./pages/StudioDetail";
import Following from "./pages/Following";
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
import Marketplace from "./pages/Marketplace";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Force dark mode
function DarkModeEnforcer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return <>{children}</>;
}

// Global Add Movie Sheet
function GlobalAddMovieSheet() {
  const { isOpen, closeAddMovie } = useAddMovie();

  const handleMovieAdded = useCallback(() => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["physical-movies"] });
    queryClient.invalidateQueries({ queryKey: ["collection"] });
  }, []);

  return <AddMovieSheet isOpen={isOpen} onClose={closeAddMovie} onMovieAdded={handleMovieAdded} />;
}

// Layout component
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, updateProfile } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === "/auth" || location.pathname === "/forgot-password";

  const hasUsername = !!profile?.username?.trim();

  // Auto-mark legacy accounts as onboarded (username already set)
  useEffect(() => {
    if (!user || !profile || loading) return;
    if (hasUsername && !profile.onboarding_complete) {
      updateProfile({ onboarding_complete: true });
    }
  }, [user, profile, loading, hasUsername, updateProfile]);

  // Show onboarding only for new accounts (no username yet)
  const showOnboarding = user && profile && !loading && !profile.onboarding_complete && !hasUsername;

  if (showOnboarding && !isAuthPage) {
    return <OnboardingWizard />;
  }

  return (
    <GamificationManager>
      {children}
      <GlobalAddMovieSheet />
    </GamificationManager>
  );
}

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/studio/:id" element={<StudioDetail />} />
        <Route path="/following" element={<Following />} />
        <Route path="/c/:shareCode" element={<PublicCollection />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/movies/:category" element={<MovieList />} />
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
    </AnimatePresence>
  );
}

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <DarkModeEnforcer>
      <TooltipProvider delayDuration={300}>
        <Toaster />
        <Sonner position="top-center" theme="dark" />
        <BrowserRouter>
          <AuthProvider>
            <BadgeNotificationProvider>
              <AddMovieProvider>
                <XPToastProvider>
                  <AppLayout>
                    <AnimatedRoutes />
                  </AppLayout>
                </XPToastProvider>
              </AddMovieProvider>
            </BadgeNotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </DarkModeEnforcer>
  </QueryClientProvider>
);

export default App;
