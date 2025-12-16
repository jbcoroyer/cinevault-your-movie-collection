import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Disc } from "lucide-react";

export const PortfolioValueCard = () => {
  // Mock data - à remplacer par les vraies données
  const totalValue = 12450;
  const growth = 12.5;
  const isPositive = growth > 0;
  const itemCount = 428;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-black border-purple-500/30 backdrop-blur-sm group hover:border-purple-500/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-purple-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Valeur de la Collection
          </span>
          <span
            className={`flex items-center text-xs px-2 py-1 rounded-full ${
              isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(growth)}%
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-white tracking-tight">{totalValue.toLocaleString("fr-FR")} €</div>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-xs text-purple-300/80">Est. basée sur le marché</p>
          <div className="h-1 w-1 rounded-full bg-purple-500/50" />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Disc className="h-3 w-3" />
            {itemCount} éditions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
