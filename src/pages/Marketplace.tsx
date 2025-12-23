import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Store, ShoppingCart, Package, Users, Shield, CreditCard, Truck, Star, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Store,
    title: "Vendez vos films",
    description: "Mettez en vente vos DVD, Blu-ray, 4K et éditions collector directement depuis votre collection.",
  },
  {
    icon: ShoppingCart,
    title: "Achetez en confiance",
    description: "Trouvez des films rares et des éditions limitées auprès de collectionneurs passionnés.",
  },
  {
    icon: Users,
    title: "Communauté de collectionneurs",
    description: "Rejoignez une communauté de passionnés et échangez avec d'autres cinéphiles.",
  },
  {
    icon: Shield,
    title: "Transactions sécurisées",
    description: "Paiements protégés par Stripe avec garantie acheteur et vendeur.",
  },
  {
    icon: CreditCard,
    title: "Paiement simplifié",
    description: "Stripe Connect pour des paiements directs aux vendeurs, sans intermédiaire.",
  },
  {
    icon: Truck,
    title: "Suivi des envois",
    description: "Suivez vos commandes en temps réel avec numéro de tracking intégré.",
  },
  {
    icon: Star,
    title: "Évaluations vendeurs",
    description: "Système de notation et d'avis pour garantir la qualité des échanges.",
  },
  {
    icon: Bell,
    title: "Alertes personnalisées",
    description: "Recevez des notifications quand un film de votre wishlist est mis en vente.",
  },
];

const Marketplace = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
            Coming Soon
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            CineVault Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bientôt, achetez et vendez vos films physiques directement sur CineVault. 
            Une marketplace dédiée aux collectionneurs passionnés de cinéma.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-border/50">
          <Package className="w-16 h-16 mx-auto mb-4 text-primary/60" />
          <h2 className="text-2xl font-bold mb-3">Restez informé</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Le marketplace CineVault est en cours de développement. 
            Continuez à enrichir votre collection pour être prêt lors du lancement !
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Marketplace;
