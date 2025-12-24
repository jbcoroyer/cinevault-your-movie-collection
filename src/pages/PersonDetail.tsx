/**
 * CineVault - Person Detail Page - Radical Minimalist Design
 *
 * Page de détail pour acteurs/réalisateurs
 * Design cohérent avec le reste de l'application
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getPersonDetails, getImageUrl, PersonDetails } from "@/services/tmdb";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
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
                  <img src={profileUrl} alt={person.name} className="w-full rounded-xl shadow-2xl" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 rounded-xl flex items-center justify-center">
                    <span className="text-white/30 text-2xl font-bold">{person.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Mobile: Info next to photo */}
              <div className="flex-1 md:hidden">
                <h1 className="font-display text-display-xs text-white mb-2">{person.name.toUpperCase()}</h1>
                {person.known_for_department && (
                  <p className="text-amber-500 text-sm mb-3">{person.known_for_department}</p>
                )}
                <PersonMeta person={person} />
              </div>
            </div>

            {/* Desktop: Main content */}
            <div className="flex-1">
              {/* Desktop: Name & Info */}
              <div className="hidden md:block mb-6">
                <h1 className="font-display text-display-sm lg:text-display-md text-white mb-2">
                  {person.name.toUpperCase()}
                </h1>
                {person.known_for_department && (
                  <p className="text-amber-500 text-lg mb-4">{person.known_for_department}</p>
                )}
                <PersonMeta person={person} />
              </div>

              {/* Biography */}
              {person.biography && (
                <div className="mt-6 md:mt-0">
                  <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Biographie</h2>
                  <p className="text-white/70 text-sm md:text-base leading-relaxed">{displayedBio}</p>
                  {shouldTruncateBio && (
                    <button
                      onClick={() => setExpandedBio(!expandedBio)}
                      className="text-amber-500 text-sm mt-2 hover:text-amber-400 transition-colors"
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

// ============================================
// Person Meta Component
// ============================================
function PersonMeta({ person }: { person: PersonDetails }) {
  return (
    <div className="space-y-2 text-sm text-white/50">
      {person.birthday && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(person.birthday).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {person.deathday && (
              <span className="text-white/30">
                {" — "}
                {new Date(person.deathday).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </span>
        </div>
      )}
      {person.place_of_birth && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-2">{person.place_of_birth}</span>
        </div>
      )}
    </div>
  );
}
