import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BadgeNotificationProvider } from "./contexts/BadgeNotificationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MovieDetail from "./pages/MovieDetail";
import Search from "./pages/Search";
import Collection from "./pages/Collection";
import Profile from "./pages/Profile";
import PersonDetail from "./pages/PersonDetail";
import Lists from "./pages/Lists";
import ListDetail from "./pages/ListDetail";
import MovieList from "./pages/MovieList";
import Feed from "./pages/Feed";
import Badges from "./pages/Badges";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import { MobileHeader } from "./components/MobileHeader";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BadgeNotificationProvider>
            {/* Le Header Mobile est placé ici pour être visible sur toutes les pages */}
            <MobileHeader />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/person/:id" element={<PersonDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/lists" element={<Lists />} />
              <Route path="/lists/:id" element={<ListDetail />} />
              <Route path="/movies/:category" element={<MovieList />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BadgeNotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
