/**
 * CineVault - Person Detail Page - Radical Minimalist Design
 *
 * Page de détail pour acteurs/réalisateurs
 * Design cohérent avec le reste de l'application
 * Avec bouton de suivi
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getPersonDetails, getImageUrl, PersonDetails } from "@/services/tmdb";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { FollowButton } from "@/components/FollowButton";
import { ArrowLeft, Calendar, MapPin, Film, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBio, setExpandedBio] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      if (!id) return;
      try {
        const data = await getPersonDetails(Number(id));
        setPerson(data);
      } catch (error) {
        console.error("Error fetching person:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
              <div className="w-32 md:w-64 h-48 md:h-96 rounded-xl bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-4">
                <div className="h-10 w-3/4 bg-white/5 animate-pulse rounded" />
                <div className="h-6 w-1/2 bg-white/5 animate-pulse rounded" />
                <div className="h-32 w-full bg-white/5 animate-pulse rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <MinimalMovieCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-white/50 mb-4">Personne non trouvée</p>
            <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors">
              Retour
            </button>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  const profileUrl = getImageUrl(person.profile_path, "w500");

  const movies =
    person.movie_credits?.cast
      ?.filter((m) => m.poster_path)
      .sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateB - dateA;
      }) || [];

  const directedMovies =
    person.movie_credits?.crew
      ?.filter((m) => m.job === "Director" && m.poster_path)
      .sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateB - dateA;
      }) || [];

  // Limiter la biographie si trop longue
  const bioLimit = 500;
  const shouldTruncateBio = person.biography && person.biography.length > bioLimit;
  const displayedBio =
    shouldTruncateBio && !expandedBio ? person.biography.substring(0, bioLimit) + "..." : person.biography;

  // Déterminer le rôle principal
  const isDirector = person.known_for_department === "Directing";
  const entityRole = isDirector ? "director" : "actor";

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Back button - mobile */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors md:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </motion.button>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-6 lg:gap-10 mb-12"
          >
            {/* Photo */}
            <div className="flex gap-4 md:flex-col md:w-64 lg:w-72">
              <div className="flex-shrink-0 w-32 md:w-full">
                {profileUrl ? (
                  <img
                    src={profileUrl}
                    alt={person.name}
                    className="w-full aspect-[2/3] object-cover rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/10 rounded-xl flex items-center justify-center">
                    <span className="text-4xl text-white/30">{person.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Mobile info */}
              <div className="flex-1 md:hidden">
                <h1 className="font-display text-display-xs text-white mb-2">{person.name.toUpperCase()}</h1>
                <p className="text-sm text-white/50 mb-3">{person.known_for_department}</p>
                
                {/* Follow Button - Mobile */}
                <FollowButton
                  entityType="person"
                  entityId={person.id}
                  entityName={person.name}
                  entityImagePath={person.profile_path}
                  entityRole={entityRole}
                  showFollowersCount
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Desktop header */}
              <div className="hidden md:flex md:items-start md:justify-between md:gap-4 mb-4">
                <div>
                  <h1 className="font-display text-display-sm lg:text-display-md text-white mb-2">
                    {person.name.toUpperCase()}
                  </h1>
                  <p className="text-white/50">{person.known_for_department}</p>
                </div>
                
                {/* Follow Button - Desktop */}
                <FollowButton
                  entityType="person"
                  entityId={person.id}
                  entityName={person.name}
                  entityImagePath={person.profile_path}
                  entityRole={entityRole}
                  showFollowersCount
                />
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-white/50">
                {person.birthday && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(person.birthday).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {person.deathday && ` - ${new Date(person.deathday).toLocaleDateString("fr-FR")}`}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {person.place_of_birth}
                  </span>
                )}
              </div>

              {/* Biography */}
              {person.biography && (
                <div className="text-white/70 leading-relaxed">
                  <p>{displayedBio}</p>
                  {shouldTruncateBio && (
                    <button
                      onClick={() => setExpandedBio(!expandedBio)}
                      className="mt-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
                    >
                      {expandedBio ? "Voir moins" : "Voir plus"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Directed Movies */}
          {directedMovies.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-6">
                <Clapperboard className="w-5 h-5 text-amber-500" />
                <h2 className="font-display text-display-xs text-white">EN TANT QUE RÉALISATEUR</h2>
                <span className="text-white/40 text-sm">({directedMovies.length})</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {directedMovies.slice(0, 16).map((movie, index) => (
                  <motion.div
                    key={`dir-${movie.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <MinimalMovieCard
                      movie={{
                        id: movie.id,
                        title: movie.title,
                        original_title: movie.original_title || movie.title,
                        poster_path: movie.poster_path,
                        backdrop_path: null,
                        overview: "",
                        release_date: movie.release_date || "",
                        vote_average: movie.vote_average || 0,
                        vote_count: 0,
                        genre_ids: [],
                        popularity: 0,
                        adult: false,
                        original_language: "",
                      }}
                      index={index}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Filmography */}
          {movies.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-2 mb-6">
                <Film className="w-5 h-5 text-white/50" />
                <h2 className="font-display text-display-xs text-white">FILMOGRAPHIE</h2>
                <span className="text-white/40 text-sm">({movies.length})</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {movies.map((movie, index) => (
                  <motion.div
                    key={`cast-${movie.id}-${movie.character}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  >
                    <MinimalMovieCard
                      movie={{
                        id: movie.id,
                        title: movie.title,
                        original_title: movie.original_title || movie.title,
                        poster_path: movie.poster_path,
                        backdrop_path: null,
                        overview: "",
                        release_date: movie.release_date || "",
                        vote_average: movie.vote_average || 0,
                        vote_count: 0,
                        genre_ids: [],
                        popularity: 0,
                        adult: false,
                        original_language: "",
                      }}
                      index={index}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
