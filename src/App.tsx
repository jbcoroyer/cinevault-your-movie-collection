/**
 * CineVault - App.tsx (CORRIGÉ)
 *
 * CORRECTIONS:
 * - Ajout du DailyBonusManager pour afficher le popup de bonus quotidien
 * - Le DailyBonusDialog s'affiche maintenant quand l'utilisateur se connecte
 */

import { useState, useEffect } from "react";
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
import { DailyBonusDialog } from "./components/gamification/DailyBonusDialog";
import { processDailyLogin } from "./services/gamificationService";

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
// NOUVEAU: Composant DailyBonusManager
// Gère l'affichage du popup de bonus quotidien
// ============================================
function DailyBonusManager({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [dailyBonusData, setDailyBonusData] = useState<{
    streak: number;
    xpEarned: number;
    popcornEarned: number;
    streakBroken: boolean;
    newBadges: string[];
  } | null>(null);
  const [hasProcessedToday, setHasProcessedToday] = useState(false);

  // Vérifier si on a déjà affiché le bonus aujourd'hui (localStorage)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const lastShown = localStorage.getItem("cinevault_daily_bonus_shown");
    if (lastShown === today) {
      setHasProcessedToday(true);
    }
  }, []);

  // Process daily login quand l'utilisateur est connecté
  useEffect(() => {
    const handleDailyLogin = async () => {
      if (!user || hasProcessedToday) return;

      try {
        const result = await processDailyLogin(user.id);

        // Vérifier si c'est un nouveau jour avec un bonus à afficher
        if (result && !result.alreadyLoggedIn && result.bonus && !result.bonus.alreadyClaimed) {
          setDailyBonusData({
            streak: result.streak?.current_streak || 1,
            xpEarned: result.bonus.xpEarned || 25,
            popcornEarned: result.bonus.popcornEarned || 5,
            streakBroken: result.streakBroken || false,
            newBadges: result.newBadges || [],
          });
          setShowDailyBonus(true);

          // Marquer comme affiché aujourd'hui
          const today = new Date().toISOString().split("T")[0];
          localStorage.setItem("cinevault_daily_bonus_shown", today);
        }

        setHasProcessedToday(true);
      } catch (error) {
        console.error("[DailyBonus] Error processing daily login:", error);
        setHasProcessedToday(true);
      }
    };

    // Petit délai pour laisser l'UI se charger
    const timer = setTimeout(handleDailyLogin, 1500);
    return () => clearTimeout(timer);
  }, [user, hasProcessedToday]);

  return (
    <>
      {children}

      {/* NOUVEAU: Dialog de bonus quotidien */}
      {dailyBonusData && (
        <DailyBonusDialog
          open={showDailyBonus}
          onOpenChange={setShowDailyBonus}
          streak={dailyBonusData.streak}
          xpEarned={dailyBonusData.xpEarned}
          popcornEarned={dailyBonusData.popcornEarned}
          streakBroken={dailyBonusData.streakBroken}
          newBadges={dailyBonusData.newBadges}
        />
      )}
    </>
  );
}

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

  // Application normale avec DailyBonusManager
  return <DailyBonusManager>{children}</DailyBonusManager>;
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
