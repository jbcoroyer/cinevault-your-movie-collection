/**
 * CineVault — Marketplace Page
 * 
 * Design: Radical Minimalist
 * Coming soon page avec preview des features
 */

import { motion } from "framer-motion";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { 
  Store, 
  ShoppingCart, 
  Package, 
  Users, 
  Shield, 
  CreditCard, 
  Truck, 
  Star, 
  Bell,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    title: "Communauté",
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
    description: "Suivez vos commandes en temps réel avec Mondial Relay et Colissimo.",
  },
  {
    icon: Star,
    title: "Évaluations",
    description: "Système de notation et d'avis pour garantir la qualité des échanges.",
  },
  {
    icon: Bell,
    title: "Alertes",
    description: "Recevez des notifications quand un film de votre wishlist est mis en vente.",
  },
];

const Marketplace = () => {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />
      
      <main className="pt-20 md:pt-28">
        {/* Hero Section */}
        <section className="px-4 md:px-12 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge 
              className="mb-6 px-4 py-2 bg-white/10 text-white border-white/20 text-sm font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Coming Soon
            </Badge>
            
            <h1 className="font-display text-display-md md:text-display-lg text-white mb-6">
              CINEVAULT
              <br />
              <span className="text-white/40">MARKETPLACE</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8">
              Bientôt, achetez et vendez vos films physiques directement sur CineVault. 
              Une marketplace dédiée aux collectionneurs passionnés de cinéma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-white/90 gap-2 rounded-full px-8"
                disabled
              >
                Rejoindre la liste d'attente
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="px-4 md:px-12 py-12">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-display text-display-xs text-white/40 mb-8 text-center md:text-left"
            >
              FEATURES
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={cn(
                    "group p-6 rounded-2xl",
                    "bg-white/5 border border-white/10",
                    "hover:bg-white/10 hover:border-white/20",
                    "transition-all duration-300"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    "bg-white/10 group-hover:bg-white/20 transition-colors"
                  )}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-12 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "max-w-4xl mx-auto text-center",
              "p-8 md:p-12 rounded-3xl",
              "bg-gradient-to-br from-white/10 to-white/5",
              "border border-white/10"
            )}
          >
            <Package className="w-16 h-16 mx-auto mb-6 text-white/30" />
            
            <h2 className="font-display text-display-xs md:text-display-sm text-white mb-4">
              PRÉPAREZ VOTRE COLLECTION
            </h2>
            
            <p className="text-white/50 max-w-md mx-auto mb-8">
              Le marketplace CineVault est en cours de développement. 
              Continuez à enrichir votre collection pour être prêt lors du lancement !
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white hover:text-black gap-2 rounded-full"
                onClick={() => window.location.href = "/collection"}
              >
                <Store className="w-4 h-4" />
                Voir ma collection
              </Button>
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white hover:text-black gap-2 rounded-full"
                onClick={() => window.location.href = "/collection?tab=wishlist"}
              >
                <Bell className="w-4 h-4" />
                Ma wishlist
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Stats Preview */}
        <section className="px-4 md:px-12 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "50K+", label: "Films référencés" },
                { value: "10K+", label: "Collectionneurs" },
                { value: "0%", label: "Frais vendeur*" },
                { value: "🇪🇺", label: "Europe entière" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={cn(
                    "p-6 rounded-2xl text-center",
                    "bg-white/5 border border-white/10"
                  )}
                >
                  <div className="font-display text-display-xs text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/40">{stat.label}</div>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-white/30 text-center mt-4">
              * Pendant la phase de lancement
            </p>
          </div>
        </section>
      </main>

      <FloatingDock />
    </div>
  );
};

export default Marketplace;
