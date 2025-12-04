import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieSection } from "@/components/MovieSection";
import { getTrendingMovies, getPopularMovies, Movie } from "@/services/tmdb";
import { WatchedTimeline } from "@/components/WatchedTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion du CORS pour les requêtes OPTIONS (pre-flight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    // Récupération de la clé API depuis les secrets Supabase
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("La clé OPENAI_API_KEY est manquante dans les secrets.");
    }

    const openai = new OpenAI({ apiKey });

    // Prompt système avec les backticks correctement échappés (\`)
    const SYSTEM_PROMPT = `Tu es un moteur de recherche cinématographique expert. Ta mission est de convertir une demande utilisateur en une configuration JSON précise pour l'API \`/discover/movie\` de TMDB.

RÈGLES D'OR POUR LE TRI (CRUCIAL) :
1. **DÉFAUT (Qualité Historique) :** Si l'utilisateur cherche un genre général (ex: "film de gangster", "science-fiction") sans préciser de date, tu DOIS trier par \`vote_average.desc\` (meilleures notes) ET ajouter \`vote_count.gte: 1000\` (minimum 1000 votes). C'est VITAL pour faire remonter les classiques (ex: "Le Parrain") plutôt que des films amateurs récents.
2. **TRENDING/ACTUALITÉ :** Utilise \`sort_by: 'popularity.desc'\` UNIQUEMENT si l'utilisateur utilise explicitement des mots comme "récent", "du moment", "tendance", "nouveauté", "populaire".
3. **LANGUE/PAYS :** Si l'utilisateur mentionne une nationalité ou langue (ex: "Français", "Coréen", "Américain"), convertis-la en code ISO 639-1 et ajoute le paramètre \`with_original_language\` (ex: 'fr', 'ko', 'en').

IDs des Genres TMDB à utiliser :
Action: 28, Aventure: 12, Animation: 16, Comédie: 35, Crime: 80 (NB: Gangster = Crime), Documentaire: 99, Drame: 18, Famille: 10751, Fantastique: 14, Histoire: 36, Horreur: 27, Musique: 10402, Mystère: 9648, Romance: 10749, SF: 878, Thriller: 53, Guerre: 10752, Western: 37.

Format de réponse JSON attendu (RETOURNER UNIQUEMENT LE JSON, pas de texte avant/après) :
{
  "with_genres": "string (ids séparés par virgules)",
  "primary_release_date.gte": "YYYY-MM-DD",
  "primary_release_date.lte": "YYYY-MM-DD",
  "with_people": "string (ids séparés par virgules)",
  "with_original_language": "string (ISO 639-1)",
  "sort_by": "string (ex: 'vote_average.desc' ou 'popularity.desc')",
  "vote_count.gte": "string (ex: '1000')",
  "vote_average.gte": "string (ex: '7.5')"
}

Exemples de comportement attendu :
- Input: "Film de gangster"
  Output: {"with_genres": "80", "sort_by": "vote_average.desc", "vote_count.gte": "1000"}
- Input: "Film action français"
  Output: {"with_genres": "28", "with_original_language": "fr", "sort_by": "vote_average.desc", "vote_count.gte": "300"}
- Input: "Comédie romantique récente"
  Output: {"with_genres": "35,10749", "sort_by": "popularity.desc", "primary_release_date.gte": "2020-01-01"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Ou "gpt-3.5-turbo" si vous préférez
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2, // Faible température pour des réponses JSON plus déterministes
    });

    const aiResponse = completion.choices[0].message.content;

    // Tentative de parsing du JSON (au cas où l'IA ajoute du texte autour)
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiResponse || "{}");
    } catch (e) {
      // Fallback si le JSON est malformé ou contient du texte
      console.error("Erreur parsing JSON IA:", aiResponse);
      // On essaie de nettoyer les balises markdown si présentes
      const cleaned = aiResponse
        ?.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      jsonResponse = JSON.parse(cleaned || "{}");
    }

    return new Response(JSON.stringify(jsonResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

export default function Index() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="py-6">
        <MovieSection title="Films populaires" movies={popular} loading={loading} />
        {/* Timeline of watched movies (only for logged in users) */}
        {user && <WatchedTimeline />}
      </main>

      <BottomNav />
    </div>
  );
}
