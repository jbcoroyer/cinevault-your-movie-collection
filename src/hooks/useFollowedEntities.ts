import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FollowedEntity,
  getFollowedEntities,
  getFollowedActors,
  getFollowedDirectors,
  getFollowedStudios,
} from "@/services/entityFollowService";
import { getPersonUpcomingMovies, getCompanyUpcomingMovies } from "@/services/tmdbCompanies";
import { Movie } from "@/services/tmdb";

interface UpcomingRelease {
  movie: Movie;
  entity: FollowedEntity;
}

interface UseFollowedEntitiesReturn {
  actors: FollowedEntity[];
  directors: FollowedEntity[];
  studios: FollowedEntity[];
  allEntities: FollowedEntity[];
  upcomingReleases: UpcomingRelease[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useFollowedEntities(): UseFollowedEntitiesReturn {
  const { user } = useAuth();
  const [actors, setActors] = useState<FollowedEntity[]>([]);
  const [directors, setDirectors] = useState<FollowedEntity[]>([]);
  const [studios, setStudios] = useState<FollowedEntity[]>([]);
  const [upcomingReleases, setUpcomingReleases] = useState<UpcomingRelease[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setActors([]);
      setDirectors([]);
      setStudios([]);
      setUpcomingReleases([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Récupérer toutes les entités suivies en parallèle
      const [actorsData, directorsData, studiosData] = await Promise.all([
        getFollowedActors(user.id),
        getFollowedDirectors(user.id),
        getFollowedStudios(user.id),
      ]);

      setActors(actorsData);
      setDirectors(directorsData);
      setStudios(studiosData);

      // Récupérer les prochaines sorties pour chaque entité
      const allEntities = [...actorsData, ...directorsData, ...studiosData];
      const upcomingPromises = allEntities.map(async (entity) => {
        try {
          let movies: Movie[] = [];
          
          if (entity.entity_type === "person") {
            movies = await getPersonUpcomingMovies(entity.entity_id);
          } else if (entity.entity_type === "company") {
            movies = await getCompanyUpcomingMovies(entity.entity_id);
          }

          return movies.slice(0, 3).map((movie) => ({
            movie,
            entity,
          }));
        } catch (error) {
          console.error(`Error fetching upcoming for ${entity.entity_name}:`, error);
          return [];
        }
      });

      const allUpcoming = await Promise.all(upcomingPromises);
      const flatUpcoming = allUpcoming.flat();

      // Trier par date de sortie
      flatUpcoming.sort((a, b) => {
        const dateA = a.movie.release_date ? new Date(a.movie.release_date).getTime() : 0;
        const dateB = b.movie.release_date ? new Date(b.movie.release_date).getTime() : 0;
        return dateA - dateB;
      });

      // Dédupliquer par film
      const seen = new Set<number>();
      const deduped = flatUpcoming.filter((item) => {
        if (seen.has(item.movie.id)) return false;
        seen.add(item.movie.id);
        return true;
      });

      setUpcomingReleases(deduped.slice(0, 20));
    } catch (error) {
      console.error("Error fetching followed entities:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    actors,
    directors,
    studios,
    allEntities: [...actors, ...directors, ...studios],
    upcomingReleases,
    loading,
    refresh: fetchData,
  };
}
