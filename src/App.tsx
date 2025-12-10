import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BadgeNotificationProvider } from "./contexts/BadgeNotificationContext";
import MobileHeader from "./components/MobileHeader";
import OnboardingWizard from "./components/OnboardingWizard";

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

const queryClient = new QueryClient();

// Composant Wrapper pour gérer l'affichage conditionnel du Wizard
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  // 1. État de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // 2. Vérification si l'utilisateur a besoin de passer par l'onboarding
  // Critères : Utilisateur connecté ET (pas de username OU username généré par défaut 'User_...')
  const needsOnboarding = user && (!profile?.username || profile.username.startsWith("User_"));

  if (needsOnboarding) {
    return <OnboardingWizard />;
  }

  // 3. Sinon, afficher l'application normale
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BadgeNotificationProvider>
            {/* Wrapper de l'application qui intercepte pour l'Onboarding */}
            <AppLayout>
              <MobileHeader />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Routes Films & Personnes */}
                <Route path="/movies" element={<MovieList />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/person/:id" element={<PersonDetail />} />
                <Route path="/search" element={<Search />} />

                {/* Routes Utilisateur & Social */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/badges" element={<Badges />} />
                <Route path="/lists" element={<Lists />} />
                <Route path="/lists/:id" element={<ListDetail />} />
                <Route path="/feed" element={<Feed />} />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BadgeNotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
