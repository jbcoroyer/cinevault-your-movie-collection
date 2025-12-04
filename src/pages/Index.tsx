import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieSection } from "@/components/MovieSection";
import { getTrendingMovies, getPopularMovies, getImageUrl, Movie } from "@/services/tmdb";
import { useAuth } from "@/contexts/AuthContext";
import { useActivities, Activity } from "@/hooks/useActivities";
import { Star, Eye, Heart, ListPlus, MessageSquare } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  
  const { getFollowingActivities } = useActivities();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [trendingData, popularData] = await Promise.all([getTrendingMovies(), getPopularMovies()]);
        setTrending(trendingData);
        setPopular(popularData);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      setActivitiesLoading(true);
      const data = await getFollowingActivities(10);
      setActivities(data);
      setActivitiesLoading(false);
    };
    
    fetchActivities();
  }, [user]);

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "rated":
        return <Star className="w-4 h-4 fill-primary text-primary" />;
      case "watched":
        return <Eye className="w-4 h-4 text-green-500" />;
      case "favorite":
        return <Heart className="w-4 h-4 fill-red-500 text-red-500" />;
      case "listed":
        return <ListPlus className="w-4 h-4 text-blue-500" />;
      case "reviewed":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case "rated":
        return `a noté ${activity.metadata?.rating ? `${activity.metadata.rating}/10` : ""}`;
      case "watched":
        return "a regardé";
      case "favorite":
        return "a ajouté aux favoris";
      case "listed":
        return "a ajouté à une liste";
      case "reviewed":
        return "a critiqué";
      default:
        return "a interagi avec";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `il y a ${minutes}min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="py-6 container mx-auto">
        {/* Activity Feed */}
        {user && activities.length > 0 && (
          <div className="px-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Quoi de neuf ?</h2>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 bg-card rounded-lg cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => navigate(`/movie/${activity.tmdb_id}`)}
                >
                  {/* Movie Poster */}
                  <div className="w-12 h-18 flex-shrink-0">
                    {activity.movie_poster_path ? (
                      <img
                        src={getImageUrl(activity.movie_poster_path, "w200") || ""}
                        alt={activity.movie_title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded flex items-center justify-center text-xs">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${activity.user_id}`);
                        }}
                        className="font-semibold hover:text-primary truncate"
                      >
                        {activity.username}
                      </button>
                      {getActivityIcon(activity.type)}
                      <span className="text-muted-foreground text-sm truncate">
                        {getActivityText(activity)}
                      </span>
                    </div>
                    <p className="font-medium truncate">{activity.movie_title}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty activity state */}
        {user && !activitiesLoading && activities.length === 0 && (
          <div className="px-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Quoi de neuf ?</h2>
            <div className="bg-card rounded-lg p-6 text-center">
              <p className="text-muted-foreground mb-2">
                Suivez d'autres utilisateurs pour voir leur activité ici
              </p>
              <p className="text-sm text-muted-foreground">
                Découvrez des profils en cliquant sur les noms d'utilisateurs
              </p>
            </div>
          </div>
        )}

        <MovieSection title="Films populaires" movies={popular} loading={loading} />
        <MovieSection title="Tendances de la semaine" movies={trending} loading={loading} />
      </main>

      <BottomNav />
    </div>
  );
}
