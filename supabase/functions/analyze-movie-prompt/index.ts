import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es un expert cinématographique. Ta mission est d'analyser une demande utilisateur et de déterminer s'il cherche :
1. UN FILM PRÉCIS (description vague d'un film spécifique)
2. UN TYPE DE FILM (genre, période, style, etc.)

RÈGLE CRITIQUE : Tu dois retourner UNIQUEMENT du JSON valide, SANS aucun commentaire (pas de // ou /* */), SANS texte explicatif.

RÈGLES IMPORTANTES :

## DÉTECTION DE FILM PRÉCIS
Si l'utilisateur décrit un film spécifique avec des éléments comme :
- Une scène mémorable ("le film où le gars dit 'Je suis ton père'")
- Un acteur + contexte ("le film avec DiCaprio sur le Titanic")
- Une intrigue spécifique ("le film avec le requin qui mange des gens")
- Un élément iconique ("le film avec le masque blanc et le couteau")
- Une citation ou réplique célèbre

→ Tu DOIS retourner : { "type": "specific", "title": "Nom exact du film en français", "original_title": "Nom original en anglais si différent" }

## EXEMPLES DE FILMS PRÉCIS :
- "le film avec le requin" → Les Dents de la mer (Jaws)
- "celui où le type dit 'here's Johnny'" → Shining (The Shining)
- "le film avec la pilule rouge ou bleue" → Matrix (The Matrix)
- "le bateau qui coule avec Kate Winslet" → Titanic
- "le film d'animation japonais avec la fille dans le monde des esprits" → Le Voyage de Chihiro
- "le film où le mec revit la même journée" → Un jour sans fin (Groundhog Day)
- "film avec Robert De Niro en taxi driver" → Taxi Driver
- "le western avec Clint Eastwood et le poncho" → Pour une poignée de dollars / Le Bon, la Brute et le Truand
- "le film d'horreur avec la fille qui sort de la télé" → Ring
- "le film français avec Jean Dujardin qui est muet" → The Artist
- "le film où le gamin voit des gens morts" → Sixième Sens (The Sixth Sense)

## RECHERCHE PAR TYPE/GENRE
Si l'utilisateur cherche une catégorie de films :
- "Film de gangster" → Type
- "Comédie française récente" → Type
- "Film d'horreur des années 80" → Type
- "Film avec des dinosaures" (sans film précis en tête) → Type

→ Retourne : { "type": "discover", "filters": {...} }

## FORMAT POUR TYPE "discover" :
{
  "type": "discover",
  "filters": {
    "with_genres": "string (IDs séparés par virgule)",
    "primary_release_date.gte": "YYYY-MM-DD",
    "primary_release_date.lte": "YYYY-MM-DD",
    "with_people": "string (IDs)",
    "with_original_language": "string (code ISO: fr, en, ko, ja...)",
    "sort_by": "string (vote_average.desc ou popularity.desc)",
    "vote_count.gte": "string (nombre)",
    "vote_average.gte": "string (nombre)"
  }
}

## IDs des Genres TMDB :
Action: 28, Aventure: 12, Animation: 16, Comédie: 35, Crime: 80, Documentaire: 99, Drame: 18, Famille: 10751, Fantastique: 14, Histoire: 36, Horreur: 27, Musique: 10402, Mystère: 9648, Romance: 10749, Science-Fiction: 878, Thriller: 53, Guerre: 10752, Western: 37

## RÈGLES DE TRI POUR "discover" :
- Par défaut (recherche de qualité) : sort_by: "vote_average.desc" + vote_count.gte: "500"
- Si "récent", "tendance", "du moment" : sort_by: "popularity.desc"

Retourne UNIQUEMENT le JSON brut, sans aucun commentaire, sans markdown, sans texte.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Le prompt est requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Analyzing prompt:", prompt);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur lors de l'analyse IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log("AI response:", content);

    // Parse the JSON from the AI response
    let result;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({ error: "Impossible de parser la réponse IA", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and return the appropriate response
    if (result.type === "specific") {
      return new Response(
        JSON.stringify({
          type: "specific",
          title: result.title,
          original_title: result.original_title || result.title,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else {
      return new Response(
        JSON.stringify({
          type: "discover",
          filters: result.filters || result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Error in analyze-movie-prompt:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
