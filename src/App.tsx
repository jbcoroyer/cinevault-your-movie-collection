import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BadgeNotificationProvider } from "@/contexts/BadgeNotificationContext";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";
import MovieDetail from "@/pages/MovieDetail";
import MovieList from "@/pages/MovieList";
import Collection from "@/pages/Collection";
import PersonDetail from "@/pages/PersonDetail";
import Lists from "@/pages/Lists";
import ListDetail from "@/pages/ListDetail";
import Badges from "@/pages/Badges";
import Settings from "@/pages/Settings";
import Feed from "@/pages/Feed";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <BadgeNotificationProvider>
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
                <Route path="/feed" element={<Feed />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BadgeNotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
