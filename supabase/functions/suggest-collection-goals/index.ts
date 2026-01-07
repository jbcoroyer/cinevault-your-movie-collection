import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollectionStats {
  totalMovies: number;
  formats: Record<string, number>;
  genres: Record<string, number>;
  decades: Record<string, number>;
  directors: Record<string, number>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, stats } = (await req.json()) as { userId: string; stats: CollectionStats };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en collection de films (DVD, Blu-ray, 4K). Tu analyses les collections et suggères des objectifs personnalisés et motivants.

Réponds UNIQUEMENT avec un JSON valide contenant un tableau "suggestions" de 3 objectifs.

Chaque suggestion doit avoir:
- title: titre court et accrocheur (max 40 caractères)
- description: description motivante (max 100 caractères)
- goal_type: "genre" | "director" | "studio" | "decade" | "format" | "count"
- target_config: configuration selon le type (ex: { "genre": "Science-Fiction" })
- target_count: nombre cible réaliste
- priority: "low" | "medium" | "high"
- reasoning: pourquoi cet objectif (max 80 caractères)

Règles:
- Les objectifs doivent être réalisables mais ambitieux
- Varier les types d'objectifs
- Se baser sur les forces et faiblesses de la collection
- Être spécifique et mesurable`;

    const userPrompt = `Analyse cette collection et suggère 3 objectifs:

Collection:
- Total: ${stats.totalMovies} films

Formats: ${JSON.stringify(stats.formats)}
Genres: ${JSON.stringify(stats.genres)}
Décennies: ${JSON.stringify(stats.decades)}
Réalisateurs: ${JSON.stringify(stats.directors)}

Réponds uniquement avec le JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded", suggestions: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", suggestions: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions = parsed.suggestions || [];

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-collection-goals:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        suggestions: [] 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
