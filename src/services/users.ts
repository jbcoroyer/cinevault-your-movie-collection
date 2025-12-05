import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  movies_watched?: number;
  movies_watchlist?: number;
  favorites_count?: number;
}

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  if (!query.trim()) return [];
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", `%${query}%`)
    .limit(20);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return data || [];
};

export const getPopularUsers = async (): Promise<UserProfile[]> => {
  // Récupérer les utilisateurs avec leurs stats
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .limit(50);

  if (profilesError || !profiles) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  // Récupérer les stats pour chaque utilisateur
  const usersWithStats = await Promise.all(
    profiles.map(async (profile) => {
      const { count: watchedCount } = await supabase
        .from("user_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("status", "watched");

      const { count: favoritesCount } = await supabase
        .from("user_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_favorite", true);

      return {
        ...profile,
        movies_watched: watchedCount || 0,
        favorites_count: favoritesCount || 0,
      };
    })
  );

  // Trier par nombre de films vus (les plus actifs en premier)
  return usersWithStats.sort((a, b) => (b.movies_watched || 0) - (a.movies_watched || 0));
};
