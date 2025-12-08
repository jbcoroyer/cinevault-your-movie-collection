import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Package, Euro, TrendingUp, Layers, Film, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CollectionStats as StatsType,
  PhysicalFormat,
  formatLabels,
  GenreStats,
  DecadeStats,
  TimelineEntry,
} from "@/services/physicalMovies";

// Couleurs pour les charts
const FORMAT_COLORS: Record<PhysicalFormat, string> = {
  dvd: "#64748b",
  bluray: "#2563eb",
  "4k": "#9333ea",
  steelbook: "#d97706",
  collector: "#dc2626",
};

const GENRE_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#6366f1", "#14b8a6", "#84cc16", "#f97316",
];

interface CollectionStatsProps {
  stats: StatsType;
  genreStats: GenreStats[];
  decadeStats: DecadeStats[];
  timelineStats: TimelineEntry[];
}

export const CollectionStats: React.FC<CollectionStatsProps> = ({
  stats,
  genreStats,
  decadeStats,
  timelineStats,
}) => {
  // Préparer les données pour le pie chart formats
  const formatData = Object.entries(stats.byFormat)
    .filter(([_, count]) => count > 0)
    .map(([format, count]) => ({
      name: formatLabels[format as PhysicalFormat],
      value: count,
      color: FORMAT_COLORS[format as PhysicalFormat],
    }));

  // Préparer les données pour le line chart timeline (6 derniers mois)
  const timelineData = timelineStats
    .slice(0, 6)
    .reverse()
    .map((entry) => ({
      name: entry.label.split(" ")[0].slice(0, 3), // "Jan", "Fév", etc.
      films: entry.count,
      depenses: entry.totalSpent,
    }));

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Films"
          value={stats.totalMovies}
          subtext={`${stats.uniqueTitles} titres uniques`}
        />
        <StatCard
          icon={<Euro className="w-5 h-5" />}
          label="Valeur totale"
          value={`${stats.totalValue.toFixed(0)}€`}
          subtext={`~${stats.averagePrice.toFixed(0)}€/film`}
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          label="Multi-éditions"
          value={stats.duplicateEditions}
          subtext="éditions supplémentaires"
        />
        <StatCard
          icon={<Film className="w-5 h-5" />}
          label="Formats"
          value={Object.keys(stats.byFormat).filter(k => stats.byFormat[k as PhysicalFormat] > 0).length}
          subtext="types différents"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Répartition par format (Pie) */}
        <ChartCard title="Répartition par format">
          {formatData.length > 0 ? (
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {formatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucune donnée de format" />
          )}
        </ChartCard>

        {/* Évolution de la collection (Line) */}
        <ChartCard title="Évolution (6 derniers mois)">
          {timelineData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      name === "films" ? `${value} films` : `${value}€`,
                      name === "films" ? "Ajoutés" : "Dépensé",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="films"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Pas assez de données" />
          )}
        </ChartCard>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Genres (Bar) */}
        <ChartCard title="Top 8 genres">
          {genreStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={genreStats.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} films`, "Total"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {genreStats.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucune donnée de genre" />
          )}
        </ChartCard>

        {/* Par décennie (Bar) */}
        <ChartCard title="Films par décennie">
          {decadeStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={decadeStats}>
                  <XAxis
                    dataKey="decade"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} films`, "Total"]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucune donnée de date" />
          )}
        </ChartCard>
      </div>
    </div>
  );
};

// Sous-composants
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext }) => (
  <div className="bg-card p-4 rounded-lg border border-border">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{subtext}</p>
  </div>
);

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <div className="bg-card p-4 rounded-lg border border-border">
    <h3 className="text-sm font-medium mb-4">{title}</h3>
    {children}
  </div>
);

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
    {message}
  </div>
);
