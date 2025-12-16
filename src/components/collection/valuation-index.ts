/**
 * CineVault - Collection Valuation Components (CORRIGÉ)
 *
 * Export centralisé de tous les composants de valorisation
 *
 * MODIFICATIONS:
 * - Tous les composants acceptent maintenant des props avec les vraies données
 * - Plus de données mockées hardcodées
 * - Intégration complète avec useCollectionValuation
 */

// Main dashboard - CORRIGÉ pour accepter les props
export { ValuationDashboardPremium } from "./ValuationDashboardPremium";

// Individual widgets - TOUS CORRIGÉS
export { PortfolioValueCard } from "./PortfolioValueCard";
export { PortfolioChart } from "./PortfolioChart";
export { RecentSalesWidget } from "./RecentSalesWidget";
export { TopGainersWidget } from "./TopGainersWidget";
export { HiddenGemsWidget } from "./HiddenGemsWidget";
export { PriceAlertDialog } from "./PriceAlertDialog";

// Types exports for consumers
export // Si vous avez des types à exporter
 type {};
