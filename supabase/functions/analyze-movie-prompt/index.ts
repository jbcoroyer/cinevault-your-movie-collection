import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Tu es un expert cinématographique avec une connaissance encyclopédique du cinéma. Ta mission est d'analyser une demande utilisateur et de déterminer s'il cherche :
1. UN FILM PRÉCIS (description d'un film spécifique, même vague)
2. UN TYPE DE FILM (genre, période, style général)

RÈGLE CRITIQUE : Tu dois retourner UNIQUEMENT du JSON valide, SANS aucun commentaire, SANS texte explicatif.

## RÈGLE PRIORITAIRE - FILMS ICONIQUES
Si la description contient un ÉLÉMENT DISTINCTIF qui évoque un film célèbre, tu DOIS retourner "specific".

ÉLÉMENTS DISTINCTIFS → FILMS :
- requin / gros requin / requin mangeur d'hommes → Les Dents de la mer (Jaws)
- requin dans tornade / sharknado → Sharknado
- extraterrestre vélo / E.T. → E.T. l'extra-terrestre
- dinosaures parc / dinosaures clonés → Jurassic Park
- anneau magique / précieux / Gollum → Le Seigneur des Anneaux
- sorcier école / Harry → Harry Potter
- bateau coule iceberg → Titanic
- pilule rouge bleue / Matrix → Matrix
- "Je suis ton père" / Vader → Star Wars
- masque blanc couteau → Halloween ou Scream
- poupée tueuse / Chucky → Jeu d'enfant
- clown égout / Pennywise → Ça (It)
- exorcisme fille → L'Exorciste
- hôtel hanté / shining → Shining
- homme invisible / bandages → L'Homme invisible
- zombie lent / mort-vivant → La Nuit des morts-vivants
- voiture DeLorean / voyage temps → Retour vers le futur

## DÉTECTION DE FILM PRÉCIS (type: "specific")
Utilise ce type si l'utilisateur mentionne :
- Un animal/créature spécifique + contexte menaçant (requin, dinosaure, alien...)
- Une scène mémorable ou élément iconique
- Un acteur + rôle ou contexte précis
- Une citation célèbre
- Une intrigue distinctive

→ Retourne : { "type": "specific", "title": "Nom français", "original_title": "Nom anglais" }

## EXEMPLES SPECIFIC :
- "film avec gros requin" → { "type": "specific", "title": "Les Dents de la mer", "original_title": "Jaws" }
- "film requin qui attaque" → { "type": "specific", "title": "Les Dents de la mer", "original_title": "Jaws" }
- "le film avec le requin" → { "type": "specific", "title": "Les Dents de la mer", "original_title": "Jaws" }
- "film dinosaures parc" → { "type": "specific", "title": "Jurassic Park", "original_title": "Jurassic Park" }
- "film avec ET" → { "type": "specific", "title": "E.T. l'extra-terrestre", "original_title": "E.T. the Extra-Terrestrial" }
- "celui où le type dit here's Johnny" → { "type": "specific", "title": "Shining", "original_title": "The Shining" }
- "le film avec la pilule rouge ou bleue" → { "type": "specific", "title": "Matrix", "original_title": "The Matrix" }
- "film bateau qui coule Kate Winslet" → { "type": "specific", "title": "Titanic", "original_title": "Titanic" }
- "film japonais fille monde esprits" → { "type": "specific", "title": "Le Voyage de Chihiro", "original_title": "Spirited Away" }
- "film même journée boucle" → { "type": "specific", "title": "Un jour sans fin", "original_title": "Groundhog Day" }

## RECHERCHE PAR TYPE (type: "discover")
Utilise ce type UNIQUEMENT si l'utilisateur cherche une CATÉGORIE GÉNÉRALE :
- "Film de gangster" (pas un film précis)
- "Comédie française récente"
- "Film d'horreur des années 80"
- "Bon film d'action"

→ Retourne : { "type": "discover", "filters": {...}, "with_keywords": "mot-clé optionnel" }

## FORMAT DISCOVER :
{
  "type": "discover",
  "filters": {
    "with_genres": "IDs séparés par virgule",
    "primary_release_date.gte": "YYYY-MM-DD",
    "primary_release_date.lte": "YYYY-MM-DD",
    "with_original_language": "code ISO (fr, en, ko, ja...)",
    "sort_by": "vote_average.desc ou popularity.desc",
    "vote_count.gte": "nombre"
  },
  "with_keywords": "mot-clé thématique si pertinent (shark, dinosaur, zombie, alien, etc.)"
}

## IDs des Genres TMDB :
Action: 28, Aventure: 12, Animation: 16, Comédie: 35, Crime: 80, Documentaire: 99, Drame: 18, Famille: 10751, Fantastique: 14, Histoire: 36, Horreur: 27, Musique: 10402, Mystère: 9648, Romance: 10749, Science-Fiction: 878, Thriller: 53, Guerre: 10752, Western: 37

## RÈGLES DE TRI :
- Par défaut : sort_by: "vote_average.desc" + vote_count.gte: "500"
- Si "récent", "tendance" : sort_by: "popularity.desc"

RAPPEL FINAL : Si la demande évoque un film célèbre même vaguement, retourne TOUJOURS "specific".
Retourne UNIQUEMENT le JSON brut.`;

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
