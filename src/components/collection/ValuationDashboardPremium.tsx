import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, TrendingUp, Sparkles, History, Trophy } from "lucide-react";
import { PortfolioValueCard } from "./PortfolioValueCard";
import { PortfolioChart } from "./PortfolioChart";
import { RecentSalesWidget } from "./RecentSalesWidget";
import { HiddenGemsWidget } from "./HiddenGemsWidget";
import { TopGainersWidget } from "./TopGainersWidget";
import { CollectionStats } from "./CollectionStats";

export const ValuationDashboardPremium = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Trésorerie de la Collection
          </h2>
          <p className="text-muted-foreground mt-1">
            Analysez la valeur et l'évolution de votre patrimoine cinématographique.
          </p>
        </div>
      </div>

      {/* Cartes de Valeur Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PortfolioValueCard />

        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Édition la plus Précieuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Blade Runner 2049</div>
            <p className="text-xs text-purple-400 mt-1">Édition Collector 4K • 120€</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink-500" />
              Potentiel Caché
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">+15%</div>
            <p className="text-xs text-muted-foreground mt-1">Sur vos éditions limitées cette année</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique Principal */}
        <div className="lg:col-span-2">
          <Card className="h-full bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Évolution de la Valeur
              </CardTitle>
              <CardDescription>Historique de la cotation de votre vidéothèque</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioChart />
            </CardContent>
          </Card>
        </div>

        {/* Widgets Latéraux */}
        <div className="space-y-6">
          <TopGainersWidget gainers={[]} />
        </div>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
          <TabsTrigger value="market" className="data-[state=active]:bg-purple-500/20">
            <History className="w-4 h-4 mr-2" />
            Dernières Ventes
          </TabsTrigger>
          <TabsTrigger value="gems" className="data-[state=active]:bg-pink-500/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Pépites Identifiées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="mt-4">
          <RecentSalesWidget />
        </TabsContent>

        <TabsContent value="gems" className="mt-4">
          <HiddenGemsWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
};
