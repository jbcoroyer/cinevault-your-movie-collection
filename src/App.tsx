import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BadgeNotificationProvider } from "@/contexts/BadgeNotificationContext";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy loading des pages pour optimiser le chargement initial
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Profile = lazy(() => import("@/pages/Profile"));
const Search = lazy(() => import("@/pages/Search"));
const MovieDetail = lazy(() => import("@/pages/MovieDetail"));
const MovieList = lazy(() => import("@/pages/MovieList"));
const Collection = lazy(() => import("@/pages/Collection"));
const PersonDetail = lazy(() => import("@/pages/PersonDetail"));
const Lists = lazy(() => import("@/pages/Lists"));
const ListDetail = lazy(() => import("@/pages/ListDetail"));
const Badges = lazy(() => import("@/pages/Badges"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

// Composant de chargement pour les transitions de page
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <BadgeNotificationProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/movies/:category" element={<MovieList />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/person/:id" element={<PersonDetail />} />
                  <Route path="/lists" element={<Lists />} />
                  <Route path="/list/:id" element={<ListDetail />} />
                  <Route path="/badges" element={<Badges />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BadgeNotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
