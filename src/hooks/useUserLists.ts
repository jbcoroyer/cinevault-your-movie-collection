import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface List {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Champs calculés pour l'affichage
  last_poster_path?: string | null;
  item_count?: number;
  posters?: string[];
}

export interface ListItem {
  id: string;
  list_id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  added_at: string;
  position: number;
}

export interface ListWithItems extends List {
  items: ListItem[];
}

export function useUserLists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      // On récupère les listes avec leurs items pour calculer les métadonnées
      // Note: Dans une app à très grande échelle, on ferait ça via une vue SQL ou une fonction RPC
      // pour éviter de charger tous les items. Pour l'instant, c'est acceptable.
      const { data, error } = await supabase
        .from("lists")
        .select(
          `
          *,
          list_items (
            poster_path,
            added_at
          )
        `,
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transformation des données pour inclure le poster du dernier film et le compte
      const listsWithMeta = (data || []).map((list: any) => {
        const items = list.list_items || [];
        // Trier par date d'ajout pour trouver le plus récent
        const sortedItems = [...items].sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
        // Extract posters (up to 10 most recent)
        const posters = sortedItems
          .slice(0, 10)
          .map((item: any) => item.poster_path)
          .filter((path: string | null) => path !== null && path !== undefined);

        return {
          id: list.id,
          user_id: list.user_id,
          title: list.title,
          description: list.description,
          is_public: list.is_public,
          created_at: list.created_at,
          updated_at: list.updated_at,
          item_count: items.length,
          last_poster_path: sortedItems.length > 0 ? sortedItems[0].poster_path : null,
          posters,
        };
      });

      setLists(listsWithMeta);
    } catch (error) {
      console.error("Error fetching lists:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos listes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [user]);

  const createList = async (title: string, description?: string, isPublic = false) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("lists")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      const newList: List = {
        ...data,
        item_count: 0,
        last_poster_path: null,
        posters: [],
      };

      setLists((prev) => [newList, ...prev]);
      toast({
        title: "Liste créée",
        description: `"${title}" a été créée`,
      });
      return data;
    } catch (error) {
      console.error("Error creating list:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la liste",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateList = async (listId: string, updates: Partial<Pick<List, "title" | "description" | "is_public">>) => {
    try {
      const { error } = await supabase.from("lists").update(updates).eq("id", listId);

      if (error) throw error;

      setLists((prev) => prev.map((list) => (list.id === listId ? { ...list, ...updates } : list)));
      toast({
        title: "Liste modifiée",
        description: "Vos modifications ont été enregistrées",
      });
    } catch (error) {
      console.error("Error updating list:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la liste",
        variant: "destructive",
      });
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase.from("lists").delete().eq("id", listId);

      if (error) throw error;

      setLists((prev) => prev.filter((list) => list.id !== listId));
      toast({
        title: "Liste supprimée",
        description: "La liste a été supprimée",
      });
    } catch (error) {
      console.error("Error deleting list:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la liste",
        variant: "destructive",
      });
    }
  };

  const getListWithItems = async (listId: string): Promise<ListWithItems | null> => {
    try {
      const { data: list, error: listError } = await supabase.from("lists").select("*").eq("id", listId).single();

      if (listError) throw listError;

      const { data: items, error: itemsError } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", listId)
        .order("position", { ascending: true });

      if (itemsError) throw itemsError;

      return { ...list, items: items || [] };
    } catch (error) {
      console.error("Error fetching list with items:", error);
      return null;
    }
  };

  const addMovieToList = async (
    listId: string,
    movie: { tmdb_id: number; title: string; poster_path: string | null },
  ) => {
    try {
      // Get current max position
      const { data: existingItems } = await supabase
        .from("list_items")
        .select("position")
        .eq("list_id", listId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = existingItems?.[0]?.position ? existingItems[0].position + 1 : 0;

      const { error } = await supabase.from("list_items").insert({
        list_id: listId,
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        position: nextPosition,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Film déjà présent",
            description: "Ce film est déjà dans cette liste",
          });
          return false;
        }
        throw error;
      }

      // Update local state to reflect change (new poster/count)
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            const newPosters = movie.poster_path 
              ? [movie.poster_path, ...(list.posters || [])].slice(0, 10)
              : list.posters || [];
            return {
              ...list,
              item_count: (list.item_count || 0) + 1,
              last_poster_path: movie.poster_path, // Update with latest added
              posters: newPosters,
              updated_at: new Date().toISOString(),
            };
          }
          return list;
        }),
      );

      toast({
        title: "Film ajouté",
        description: `"${movie.title}" a été ajouté à la liste`,
      });
      return true;
    } catch (error) {
      console.error("Error adding movie to list:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le film à la liste",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeMovieFromList = async (listId: string, tmdbId: number) => {
    try {
      const { error } = await supabase.from("list_items").delete().eq("list_id", listId).eq("tmdb_id", tmdbId);

      if (error) throw error;

      // Note: We don't easily update last_poster_path here without refetching,
      // but we can update the count
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              item_count: Math.max(0, (list.item_count || 0) - 1),
              updated_at: new Date().toISOString(),
            };
          }
          return list;
        }),
      );

      toast({
        title: "Film retiré",
        description: "Le film a été retiré de la liste",
      });
      return true;
    } catch (error) {
      console.error("Error removing movie from list:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer le film",
        variant: "destructive",
      });
      return false;
    }
  };

  const getListsForMovie = async (tmdbId: number): Promise<string[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.from("list_items").select("list_id").eq("tmdb_id", tmdbId);

      if (error) throw error;
      return data?.map((item) => item.list_id) || [];
    } catch (error) {
      console.error("Error checking movie lists:", error);
      return [];
    }
  };

  return {
    lists,
    loading,
    createList,
    updateList,
    deleteList,
    getListWithItems,
    addMovieToList,
    removeMovieFromList,
    getListsForMovie,
    refreshLists: fetchLists,
  };
}
