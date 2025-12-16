import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sale {
  id: string;
  movie_title: string;
  format: string;
  price: number;
  date: string;
  image?: string;
}

// Données fictives pour la démo
const MOCK_SALES: Sale[] = [
  {
    id: "1",
    movie_title: "Dune: Part Two",
    format: "Steelbook 4K",
    price: 45.0,
    date: "Il y a 2h",
    image: "https://image.tmdb.org/t/p/w92/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  },
  {
    id: "2",
    movie_title: "Oppenheimer",
    format: "Collector Blu-ray",
    price: 32.5,
    date: "Il y a 5h",
    image: "https://image.tmdb.org/t/p/w92/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
  },
  {
    id: "3",
    movie_title: "The Godfather",
    format: "Coffret 50th Anniv",
    price: 89.9,
    date: "Il y a 1j",
    image: "https://image.tmdb.org/t/p/w92/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  },
];

export const RecentSalesWidget = () => {
  const getEbayUrl = (title: string, format: string) => {
    const query = encodeURIComponent(`${title} ${format}`);
    // Utilisation d'un lien de recherche générique eBay
    return `https://www.ebay.fr/sch/i.html?_nkw=${query}&_sacat=11232`; // Catégorie DVD/Cinéma
  };

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5 text-blue-400" />
          Dernières Ventes Similaires
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {MOCK_SALES.map((sale) => (
          <a
            key={sale.id}
            href={getEbayUrl(sale.movie_title, sale.format)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer border border-transparent hover:border-blue-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-14 rounded overflow-hidden bg-gray-800 shrink-0">
                {sale.image && <img src={sale.image} alt={sale.movie_title} className="w-full h-full object-cover" />}
              </div>
              <div>
                <h4 className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors">
                  {sale.movie_title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground bg-white/10 px-1.5 py-0.5 rounded">{sale.format}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {sale.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-green-400">{sale.price.toFixed(2)} €</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
            </div>
          </a>
        ))}

        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white mt-2">
          Voir plus de transactions
        </Button>
      </CardContent>
    </Card>
  );
};
