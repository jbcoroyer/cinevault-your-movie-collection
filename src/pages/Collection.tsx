import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Film } from "lucide-react";

export default function Collection() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Ma Collection</h1>

        <div className="text-center py-16">
          <Film className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Bientôt disponible</h3>
          <p className="text-muted-foreground">
            De nouvelles fonctionnalités arrivent bientôt
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}