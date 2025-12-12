/**
 * DESTINY MATRIX - Graphique Radar Néo-Rétro
 * Analyse automatique du profil collectionneur
 */

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { DESTINY_AXES } from "@/data/videoClubData";
import { cn } from "@/lib/utils";

interface DestinyStats {
  guardian: number; // 0-100
  specialist: number; // 0-100
  completist: number; // 0-100
}

interface DestinyMatrixProps {
  stats: DestinyStats;
  className?: string;
}

export function DestinyMatrix({ stats, className }: DestinyMatrixProps) {
  const data = useMemo(() => [
    {
      axis: "Gardien",
      value: stats.guardian,
      fullMark: 100,
    },
    {
      axis: "Spécialiste",
      value: stats.specialist,
      fullMark: 100,
    },
    {
      axis: "Complétiste",
      value: stats.completist,
      fullMark: 100,
    },
  ], [stats]);

  // Déterminer la destinée dominante
  const dominantDestiny = useMemo(() => {
    const entries = Object.entries(stats) as [keyof DestinyStats, number][];
    const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    return DESTINY_AXES.find(d => d.id === max[0]);
  }, [stats]);

  return (
    <div className={cn("relative", className)}>
      {/* Glow effect behind chart */}
      <div className="absolute inset-0 blur-3xl opacity-30">
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${dominantDestiny?.color || 'hsl(199 89% 48%)'} 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            {/* Grille sombre subtile */}
            <PolarGrid 
              stroke="hsl(220 15% 20%)" 
              strokeWidth={1}
              strokeOpacity={0.5}
            />
            
            {/* Labels minimalistes */}
            <PolarAngleAxis
              dataKey="axis"
              tick={{ 
                fill: 'hsl(220 10% 60%)', 
                fontSize: 11,
                fontFamily: 'Space Grotesk, monospace',
                fontWeight: 500,
              }}
              tickLine={false}
            />

            {/* Zone remplie avec bordure néon */}
            <Radar
              name="Destinée"
              dataKey="value"
              stroke="hsl(199 89% 48%)"
              strokeWidth={2.5}
              fill="hsl(199 89% 48%)"
              fillOpacity={0.15}
              dot={{
                r: 4,
                fill: "hsl(199 89% 48%)",
                stroke: "hsl(0 0% 6%)",
                strokeWidth: 2,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Dominant Destiny Label */}
        {dominantDestiny && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-videoclub-surface border border-videoclub-cyan/30">
              <dominantDestiny.icon 
                className="w-4 h-4" 
                style={{ color: dominantDestiny.color }}
              />
              <span 
                className="text-sm font-mono font-medium"
                style={{ color: dominantDestiny.color }}
              >
                {dominantDestiny.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {dominantDestiny.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook pour calculer les stats de destinée depuis les données utilisateur
 */
export function useDestinyStats(movies: any[], reviews: any[]): DestinyStats {
  return useMemo(() => {
    let guardian = 0;
    let specialist = 0;
    let completist = 0;

    if (!movies?.length) {
      return { guardian: 0, specialist: 0, completist: 0 };
    }

    // Guardian: VHS, films anciens
    const vhsCount = movies.filter(m => 
      m.format?.toLowerCase().includes("vhs") || 
      m.format?.toLowerCase().includes("laserdisc")
    ).length;
    guardian = Math.min(100, (vhsCount / 20) * 100);

    // Specialist: concentration sur un genre (simplifié)
    // En production, on analyserait les genres via TMDB
    const genreCounts: Record<string, number> = {};
    movies.forEach(m => {
      const genre = m.notes?.includes("horror") ? "horror" : 
                    m.notes?.includes("sci-fi") ? "scifi" : "other";
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    const maxGenreRatio = Math.max(...Object.values(genreCounts)) / movies.length;
    specialist = maxGenreRatio > 0.3 ? Math.min(100, maxGenreRatio * 150) : maxGenreRatio * 100;

    // Completist: nombre total et diversité
    completist = Math.min(100, (movies.length / 100) * 100);

    return {
      guardian: Math.round(guardian),
      specialist: Math.round(specialist),
      completist: Math.round(completist),
    };
  }, [movies, reviews]);
}
