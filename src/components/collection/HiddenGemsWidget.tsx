import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, ArrowUpRight, Search } from "lucide-react";

interface HiddenGem {
  id: string;
  title: string;
  reason: string;
  estimatedValue: string;
  image?: string;
  type: string;
}

const MOCK_GEMS: HiddenGem[] = [
  {
    id: "1",
    title: "Oldboy (2003)",
    reason: "Édition Limitée épuisée",
    estimatedValue: "85€ - 120€",
    image: "https://image.tmdb.org/t/p/w92/pWDtjs568Zf52uYyBsKpvxmYz0.jpg",
    type: "Steelbook",
  },
  {
    id: "2",
    title: "La Haine",
    reason: "Collection Criterion 4K",
    estimatedValue: "45€ - 60€",
    image: "https://image.tmdb.org/t/p/w92/zZ4Y8T55r90k1gZ2V8p8.jpg",
    type: "Criterion",
  },
  {
    id: "3",
    title: "Akira",
    reason: "35th Anniversary Box",
    estimatedValue: "70€ - 90€",
    image: "https://image.tmdb.org/t/p/w92/neZ070oKzK9Yk0F1Z4p1.jpg",
    type: "Coffret",
  },
];

export const HiddenGemsWidget = () => {
  const getEbayUrl = (title: string, type: string) => {
    const query = encodeURIComponent(`${title} ${type} rare`);
    return `https://www.ebay.fr/sch/i.html?_nkw=${query}&_sacat=11232`;
  };

  return (
    <Card className="bg-black/40 border-pink-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-pink-100">
          <Gem className="h-5 w-5 text-pink-500" />
          Pépites Cachées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {MOCK_GEMS.map((gem) => (
          <a
            key={gem.id}
            href={getEbayUrl(gem.title, gem.type)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg bg-pink-500/5 hover:bg-pink-500/10 transition-all border border-pink-500/10 hover:border-pink-500/30 group cursor-pointer"
          >
            <div className="relative w-12 h-16 rounded overflow-hidden shrink-0 shadow-lg">
              {gem.image && (
                <img
                  src={gem.image}
                  alt={gem.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm text-pink-100 truncate pr-2 group-hover:text-pink-400 transition-colors">
                  {gem.title}
                </h4>
                <ArrowUpRight className="h-3 w-3 text-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-pink-300/70 mt-0.5">{gem.reason}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono bg-black/40 px-1.5 py-0.5 rounded text-pink-200 border border-pink-500/20">
                  Est. {gem.estimatedValue}
                </span>
                <span className="text-[10px] flex items-center gap-1 text-muted-foreground group-hover:text-pink-300 transition-colors">
                  <Search className="w-3 h-3" />
                  Vérifier
                </span>
              </div>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
};
