/**
 * CineVault - App.tsx AMÉLIORÉ
 *
 * INTÉGRATIONS:
 * - XPToastProvider pour les notifications de gain XP
 * - GamificationManager pour les bonus quotidiens
 * - Transitions de page fluides
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BadgeNotificationProvider } from "./contexts/BadgeNotificationContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { MobileHeader } from "./components/MobileHeader";
import OnboardingWizard from "./components/OnboardingWizard";
import { GamificationManager } from "./components/gamification/GamificationManager";
import { XPToastProvider } from "./components/gamification/XPToast";
import PublicCollection from "@/pages/PublicCollection";

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
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Layout component with conditional mobile header
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === "/auth" || location.pathname === "/forgot-password";

  // Show onboarding for new users
  const showOnboarding = user && !loading && !localStorage.getItem(`onboarding_complete_${user.id}`);

  if (showOnboarding && !isAuthPage) {
    return <OnboardingWizard />;
  }

  return <GamificationManager>{children}</GamificationManager>;
}

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/c/:shareCode" element={<PublicCollection />} />
        <Route path="/marketplace" element={<Marketplace />} />
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
    </AnimatePresence>
  );
}

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider delayDuration={300}>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <AuthProvider>
            <BadgeNotificationProvider>
              <XPToastProvider>
                <AppLayout>
                  <MobileHeader />
                  <AnimatedRoutes />
                </AppLayout>
              </XPToastProvider>
            </BadgeNotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
