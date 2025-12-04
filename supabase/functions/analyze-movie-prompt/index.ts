import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Tu es un assistant expert en cinéma et un spécialiste de l'API TMDB (The Movie Database). Ton rôle est de traduire des requêtes utilisateurs en langage naturel (souvent vagues ou basées sur l'humeur) en paramètres de filtrage JSON précis pour l'endpoint \`/discover/movie\` de TMDB.

Voici les IDs officiels des genres TMDB à utiliser impérativement :
- Action: 28, Aventure: 12, Animation: 16, Comédie: 35, Crime: 80, Documentaire: 99, Drame: 18, Famille: 10751, Fantastique: 14, Histoire: 36, Horreur: 27, Musique: 10402, Mystère: 9648, Romance: 10749, Science-Fiction: 878, Téléfilm: 10770, Thriller: 53, Guerre: 10752, Western: 37.

Règles d'interprétation :
1. **Humeurs et Émotions :** Si l'utilisateur dit "qui fait pleurer", "triste", "émouvant" -> Ajoute le genre Drame (18) ou Romance (10749). Si "qui fait peur" -> Horreur (27). Si "adrénaline" -> Action (28).
2. **Périodes :** Convertis "années 90" en \`primary_release_date.gte: '1990-01-01'\` et \`primary_release_date.lte: '1999-12-31'\`. Pour "vieux films", vise avant 1980.
3. **Acteurs/Réalisateurs :** Si une célébrité très connue est mentionnée (ex: Tom Hanks, Christopher Nolan), essaie de trouver son ID TMDB (ex: Tom Hanks = 31) et ajoute-le dans le paramètre \`with_people\`. Si tu ne connais pas l'ID avec certitude, ignore ce critère pour ne pas casser la recherche.
4. **Tri :** Par défaut, utilise \`sort_by: 'popularity.desc'\`. Si l'utilisateur cherche des "chefs d'œuvre" ou "meilleurs films", utilise \`vote_average.desc\` et ajoute \`vote_count.gte: 300\` pour éviter les films inconnus.

Format de réponse attendu (JSON pur uniquement, sans markdown ni backticks) :
{
  "with_genres": "string (ids séparés par des virgules, ex: '18,35')",
  "primary_release_date.gte": "YYYY-MM-DD",
  "primary_release_date.lte": "YYYY-MM-DD",
  "with_people": "string (ids séparés par des virgules)",
  "sort_by": "string",
  "vote_count.gte": "number (optionnel)"
}

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
