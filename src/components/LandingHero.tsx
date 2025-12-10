import { Link, useNavigate } from "react-router-dom";
import {
  Library,
  Users,
  Trophy,
  Star,
  Disc,
  Heart,
  ListVideo,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Play,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { CollectionPreview } from "./CollectionPreview";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, accentColor, delay = 0 }) => (
  <div
    className={cn(
      "group relative p-6 rounded-2xl",
      "bg-card/50 backdrop-blur-sm border border-border/50",
      "hover:border-amber-500/30 hover:bg-card/80",
      "transition-all duration-500 ease-out",
      "animate-fade-in",
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
        "transition-transform duration-300 group-hover:scale-110",
        accentColor,
      )}
    >
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const features = [
  {
    icon: Library,
    title: "Collection Physique",
    description: "Cataloguez vos DVD, Blu-ray, 4K UHD et éditions collector. Suivez chaque format et édition spéciale.",
    accentColor: "bg-amber-500/20 text-amber-500",
  },
  {
    icon: Heart,
    title: "Favoris & Wishlist",
    description: "Marquez vos films préférés et créez votre liste de souhaits pour ne jamais manquer une sortie.",
    accentColor: "bg-rose-500/20 text-rose-500",
  },
  {
    icon: ListVideo,
    title: "Listes Personnalisées",
    description: "Organisez vos films par genre, réalisateur, saga ou créez vos propres thématiques.",
    accentColor: "bg-blue-500/20 text-blue-500",
  },
  {
    icon: Users,
    title: "Communauté",
    description: "Suivez d'autres collectionneurs, découvrez leurs trouvailles et partagez vos acquisitions.",
    accentColor: "bg-emerald-500/20 text-emerald-500",
  },
  {
    icon: Trophy,
    title: "Badges & Niveaux",
    description: "Gagnez de l'XP, débloquez des badges et montez en niveau. Devenez un collectionneur légendaire !",
    accentColor: "bg-purple-500/20 text-purple-500",
  },
  {
    icon: TrendingUp,
    title: "Statistiques",
    description: "Visualisez votre collection avec des stats détaillées : genres, années, réalisateurs favoris.",
    accentColor: "bg-cyan-500/20 text-cyan-500",
  },
];

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/5 to-transparent rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                La plateforme des cinéphiles
              </span>
            </div>

            {/* Titre Principal */}
            <h1
              className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              Votre collection de films,{" "}
              <span className="relative">
                <span className="text-amber-500">sublimée</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path
                    d="M2 6C50 2 150 2 198 6"
                    stroke="rgb(245 158 11)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                </svg>
              </span>
            </h1>

            {/* Sous-titre */}
            <p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Cataloguez vos DVD, Blu-ray et 4K UHD. Rejoignez une communauté de passionnés, gagnez des badges et
              découvrez des éditions rares.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold px-8 py-6 rounded-full shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:scale-105"
              >
                <Disc className="w-5 h-5 mr-2" />
                Créer ma collection
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto text-base px-8 py-6 rounded-full border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5"
              >
                Se connecter
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Social Proof */}
            <div
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span>+500 collectionneurs</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span>Noté 5/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          COLLECTION PREVIEW - VUE ÉTAGÈRE
          ============================================ */}
      <CollectionPreview />

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Tout pour votre passion du cinéma</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Des outils pensés par des collectionneurs, pour des collectionneurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} delay={index * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">Prêt à démarrer l'aventure ?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoignez gratuitement CineVault et commencez à cataloguer votre collection dès maintenant.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold px-10 py-6 rounded-full shadow-lg shadow-amber-500/25"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingHero;
