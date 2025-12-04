import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Tu es un moteur de recherche cinématographique expert. Ta mission est de convertir une demande utilisateur en une configuration JSON précise pour l'API \`/discover/movie\` de TMDB.

RÈGLES D'OR POUR LE TRI (CRUCIAL) :
1. **DÉFAUT (Qualité Historique) :** Si l'utilisateur cherche un genre (ex: "film de gangster", "science-fiction"), tu DOIS trier par \`vote_average.desc\` ET ajouter \`vote_count.gte: 1000\`. C'est vital pour que "Film de gangster" sorte "Le Parrain" et non un film obscur récent.
2. **TRENDING :** Utilise \`sort_by: 'popularity.desc'\` UNIQUEMENT si l'utilisateur utilise des mots comme "récent", "du moment", "tendance", "nouveauté".
3. **LANGUE/PAYS :** Si l'utilisateur mentionne une nationalité ou langue (ex: "Français", "Coréen", "Américain"), ajoute le paramètre \`with_original_language\` (ex: 'fr', 'ko', 'en').

IDs des Genres (Rappel) :
Action: 28, Aventure: 12, Animation: 16, Comédie: 35, Crime: 80 (Gangster=Crime), Documentaire: 99, Drame: 18, Famille: 10751, Fantastique: 14, Histoire: 36, Horreur: 27, Musique: 10402, Mystère: 9648, Romance: 10749, SF: 878, Thriller: 53, Guerre: 10752, Western: 37.

Format de réponse JSON attendu (JSON pur uniquement, sans markdown ni backticks) :
{
  "with_genres": "string (ids)",
  "primary_release_date.gte": "YYYY-MM-DD",
  "primary_release_date.lte": "YYYY-MM-DD",
  "with_people": "string (ids)",
  "with_original_language": "string (code ISO 639-1, ex: 'fr', 'en', 'es', 'ja', 'ko')",
  "sort_by": "string (ex: 'vote_average.desc' ou 'popularity.desc')",
  "vote_count.gte": "string (nombre, ex: '500')",
  "vote_average.gte": "string (nombre, ex: '7')"
}

Exemple 1 : "Film de gangster"
Output : {"with_genres": "80", "sort_by": "vote_average.desc", "vote_count.gte": "1000"}

Exemple 2 : "Film action français"
Output : {"with_genres": "28", "with_original_language": "fr", "sort_by": "vote_average.desc", "vote_count.gte": "300"}

Exemple 3 : "Comédie récente"
Output : {"with_genres": "35", "sort_by": "popularity.desc", "primary_release_date.gte": "2020-01-01"}

Retourne UNIQUEMENT le JSON, sans aucun texte supplémentaire.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Le prompt est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'analyse IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log('AI response:', content);

    // Parse the JSON from the AI response
    let filters;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      filters = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Impossible de parser la réponse IA', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ filters }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-movie-prompt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
