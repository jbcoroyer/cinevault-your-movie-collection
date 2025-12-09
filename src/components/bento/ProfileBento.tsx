import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Disc, 
  Eye, 
  Heart, 
  Star, 
  Clock, 
  Trophy,
  Settings,
  Share2,
  Loader2,
  Film,
  Tv,
  Crown,
  ArrowRight
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { getPhysicalMovies, PhysicalMovie, formatLabels } from "@/services/physicalMovies";
import { useUserMovies } from "@/hooks/useUserMovies";
import { getMovieDetails, getImageUrl, MovieDetails } from "@/services/tmdb";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { formatDistanceToNow, isValid } from "date-fns";
import { fr } from "date-fns/locale";

interface ProfileBentoProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export const ProfileBento: React.FC<ProfileBentoProps> = ({ userId, isOwnProfile = false }) => {
  const navigate = useNavigate();
  const { user, profile: myProfile } = useAuth();
  const { currentLevel, currentXp, progressPercent } = useBadgeNotification();
  const { userMovies } = useUserMovies();

  const [profileData, setProfileData] = useState<any>(null);
  const [lastWatched, setLastWatched] = useState<{ movie: MovieDetails; date: string; rating?: number } | null>(null);
  const [lastBought, setLastBought] = useState<{ movie: MovieDetails; physical: PhysicalMovie } | null>(null);
  const [lastFavorite, setLastFavorite] = useState<{ movie: MovieDetails; date: string } | null>(null);
  const [stats, setStats] = useState({ movies: 0, watched: 0, hours: 0 });
  const [loading, setLoading] = useState(true);

  const targetId = userId || user?.id;

  useEffect(() => {
    if (!targetId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Charger le profil
        let profile = isOwnProfile ? myProfile : null;
        if (!profile) {
          const { data } = await supabase.from("profiles").select("*").eq("id", targetId).single();
          profile = data;
        }
        setProfileData(profile);

        // 2. Charger les films physiques
        const physicalMovies = await getPhysicalMovies(targetId);
        setStats(prev => ({ ...prev, movies: physicalMovies.length }));

        if (physicalMovies.length > 0) {
          const lastOne = physicalMovies[0];
          try {
            const details = await getMovieDetails(lastOne.tmdb_id);
            setLastBought({ movie: details, physical: lastOne });
          } catch (e) {
            console.error("Erreur chargement détails film physique", e);
          }
        }

        // 3. Charger les films vus et favoris
        let watchedList: any[] = [];
        let favoritesList: any[] = [];

        if (isOwnProfile) {
            watchedList = userMovies.filter(m => m.status === 'watched');
            favoritesList = userMovies.filter(m => m.is_favorite);
        } else {
             const { data: moviesData } = await supabase
            .from("user_movies")
            .select("*")
            .eq("user_id", targetId);
            
            if (moviesData) {
                watchedList = moviesData.filter(m => m.status === 'watched');
                favoritesList = moviesData.filter(m => m.is_favorite);
            }
        }

        setStats(prev => ({ ...prev, watched: watchedList.length, hours: watchedList.length * 2 }));

        // Dernier vu
        if (watchedList.length > 0) {
            watchedList.sort((a, b) => new Date(b.watched_at || b.created_at || 0).getTime() - new Date(a.watched_at || a.created_at || 0).getTime());
            const last = watchedList[0];
            try {
                const details = await getMovieDetails(last.tmdb_id);
                setLastWatched({ 
                    movie: details, 
                    date: last.watched_at || last.created_at || new Date().toISOString(), 
                    rating: last.rating 
                });
            } catch (e) { console.error(e); }
        }

        // Dernier favori
        if (favoritesList.length > 0) {
             favoritesList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
             const last = favoritesList[0];
             try {
                const details = await getMovieDetails(last.tmdb_id);
                setLastFavorite({ movie: details, date: last.created_at || new Date().toISOString() });
             } catch (e) { console.error(e); }
        }

      } catch (error) {
        console.error("Erreur chargement profil bento", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [targetId, isOwnProfile, myProfile, userMovies]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const getInitials = (name: string) => name ? name.slice(0, 2).toUpperCase() : "U";

  // Helper pour formater la date en toute sécurité
  const safeTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) 
      ? formatDistanceToNow(date, { addSuffix: true, locale: fr }) 
      : "récemment";
  };

  return (
    <div className="w-full font-sans selection:bg-primary selection:text-white mb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(160px,auto)]">
        
        {/* 1. Carte Profil */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-card rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-start justify-between z-10">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full p-1 border-2 border-border bg-background relative z-10 overflow-hidden">
                    <Avatar className="w-full h-full">
                        <AvatarImage src={profileData?.avatar_url} style={{ objectFit: 'cover' }} />
                        <AvatarFallback className="bg-muted text-xl font-bold">{getInitials(profileData?.username)}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background z-20">
                    Niv. {currentLevel}
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold font-display">{profileData?.username || "Cinéphile"}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{Math.floor(currentXp)} XP</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium border border-primary/20">Membre Pro</span>
                  {stats.movies > 50 && (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full font-medium border border-amber-500/20 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Expert
                      </span>
                  )}
                </div>
              </div>
            </div>
            
            {isOwnProfile && (
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/settings')}>
                    <Settings className="w-5 h-5" />
                </Button>
            )}
          </div>

          <p className="text-muted-foreground z-10 mt-6 md:mt-0 max-w-md line-clamp-2">
            {profileData?.bio || "Pas encore de biographie. Ajoutez quelques mots sur vos goûts cinématographiques !"}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6 z-10 bg-muted/30 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
            <div className="text-center group-hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-bold">{stats.movies}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                <Disc className="w-3 h-3" /> Physique
              </div>
            </div>
            <div className="text-center border-l border-border/50 group-hover:scale-105 transition-transform duration-300 delay-75">
              <div className="text-2xl font-bold">{stats.watched}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" /> Vus
              </div>
            </div>
            <div className="text-center border-l border-border/50 group-hover:scale-105 transition-transform duration-300 delay-100">
              <div className="text-2xl font-bold">{stats.hours}h+</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Temps
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dernier Visionnage */}
        {lastWatched ? (
            <Link to={`/movie/${lastWatched.movie.id}`} className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2 bg-zinc-900 rounded-3xl p-0 flex flex-col relative overflow-hidden group border border-border/50 hover:border-primary/50 transition-all duration-300">
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <Eye className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-medium text-white">Vu récemment</span>
            </div>
            
            <div className="h-full w-full relative">
                <img 
                src={getImageUrl(lastWatched.movie.poster_path, 'w500') || ''} 
                alt={lastWatched.movie.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-5">
                <h3 className="text-lg font-bold text-white truncate leading-tight">{lastWatched.movie.title}</h3>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1 text-amber-400">
                        {lastWatched.rating ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < (lastWatched.rating || 0) ? 'fill-current' : 'text-zinc-600'}`} />
                            ))
                        ) : (
                            <span className="text-xs text-white/50">Non noté</span>
                        )}
                    </div>
                    <span className="text-xs text-zinc-400">
                        {safeTimeAgo(lastWatched.date)}
                    </span>
                </div>
                </div>
            </div>
            </Link>
        ) : (
            <div className="col-span-1 row-span-2 bg-card rounded-3xl flex flex-col items-center justify-center p-6 border border-border/50 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Aucun film vu récemment</p>
            </div>
        )}

        {/* 3. Statistiques rapides */}
        <div className="bg-gradient-to-br from-amber-500/10 to-card rounded-3xl p-5 border border-amber-500/20 flex flex-col justify-center items-center hover:bg-amber-500/5 transition-colors cursor-pointer group">
          <Trophy className="w-8 h-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">Top 10%</span>
          <span className="text-xs text-muted-foreground">Visionneur ce mois</span>
        </div>

         {/* 4. Total Séries/Films */}
         <div className="bg-card rounded-3xl p-5 border border-border/50 flex flex-col justify-center items-center hover:border-primary/30 transition-colors group">
          <div className="flex gap-2 mb-2">
             <Film className="w-5 h-5 text-purple-400 group-hover:-translate-y-1 transition-transform" />
             <Tv className="w-5 h-5 text-pink-400 group-hover:-translate-y-1 transition-transform delay-75" />
          </div>
          <span className="text-2xl font-bold">{stats.watched}</span>
          <span className="text-xs text-muted-foreground">Titres découverts</span>
        </div>

        {/* 5. Dernier Achat */}
        {lastBought ? (
             <Link to={`/collection`} className="col-span-1 md:col-span-2 bg-card rounded-3xl p-6 flex gap-6 items-center border border-border/50 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
             <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/20 transition-colors"></div>
             
             <div className="relative shrink-0 w-24 h-36 rounded-lg overflow-hidden shadow-lg shadow-black/20 rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500 z-10 border border-white/10">
                <img 
                 src={getImageUrl(lastBought.movie.poster_path, 'w300') || ''} 
                 alt={lastBought.movie.title}
                 className="w-full h-full object-cover" 
               />
               <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ transform: 'translateX(-100%)', animation: 'shine 1.5s infinite' }} />
             </div>
             
             <div className="flex flex-col z-10 w-full min-w-0">
               <div className="flex items-center gap-2 mb-2">
                 <div className="p-1.5 bg-orange-500/10 rounded-lg">
                   <Disc className="w-4 h-4 text-orange-500" />
                 </div>
                 <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Dernier Achat</span>
               </div>
               
               <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">{lastBought.movie.title}</h3>
               <p className="text-sm text-muted-foreground mt-1 font-medium">{formatLabels[lastBought.physical.format]}</p>
               
               <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                 <span className="font-mono text-lg font-semibold text-foreground">
                    {lastBought.physical.price ? `${lastBought.physical.price}€` : 'Prix N/A'}
                 </span>
                 <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(lastBought.physical.created_at || '').toLocaleDateString()}
                 </span>
               </div>
             </div>
           </Link>
        ) : (
            <Link to="/collection" className="col-span-1 md:col-span-2 bg-card rounded-3xl p-6 flex flex-col items-center justify-center border border-border/50 border-dashed hover:border-primary/50 transition-colors gap-2 text-muted-foreground hover:text-primary">
                <Disc className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">Ajouter un premier film physique</span>
            </Link>
        )}

        {/* 6. Favoris */}
        {lastFavorite ? (
            <Link to={`/movie/${lastFavorite.movie.id}`} className="col-span-1 md:col-span-1 lg:col-span-2 bg-card rounded-3xl p-6 border border-border/50 flex flex-col relative overflow-hidden hover:border-red-500/30 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4 z-10">
                <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse-slow" />
                <span className="font-medium text-foreground">Coup de Cœur</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="flex gap-4 items-center z-10 mt-auto">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-md ring-2 ring-white/10">
                <img src={getImageUrl(lastFavorite.movie.poster_path, 'w200') || ''} className="w-full h-full object-cover" alt="Favori" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-lg leading-tight truncate text-foreground group-hover:text-red-500 transition-colors">{lastFavorite.movie.title}</h4>
                    <p className="text-sm text-muted-foreground italic truncate">
                        Ajouté {safeTimeAgo(lastFavorite.date)}
                    </p>
                </div>
            </div>
            
            <div className="absolute inset-0 z-0">
                <img 
                    src={getImageUrl(lastFavorite.movie.backdrop_path || lastFavorite.movie.poster_path, 'w780') || ''} 
                    className="w-full h-full object-cover opacity-10 blur-sm scale-110 group-hover:scale-100 transition-transform duration-1000 grayscale group-hover:grayscale-0" 
                    alt="bg" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent"></div>
            </div>
            </Link>
        ) : (
            <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-card rounded-3xl p-6 border border-border/50 flex flex-col items-center justify-center text-center gap-2">
                 <Heart className="w-8 h-8 text-muted-foreground/30" />
                 <span className="text-sm text-muted-foreground">Aucun coup de cœur pour l'instant</span>
            </div>
        )}

      </div>
    </div>
  );
};
