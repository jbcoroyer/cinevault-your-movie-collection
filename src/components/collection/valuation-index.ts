/**
 * CineVault - Collection Valuation Components
 * 
 * Export centralisé de tous les composants de valorisation premium
 */

// Main dashboard
export { ValuationDashboardPremium } from "./ValuationDashboardPremium";
export { default as ValuationDashboard } from "./ValuationDashboardPremium";

// Individual widgets
export { PortfolioValueCard } from "./PortfolioValueCard";
export { PortfolioChart } from "./PortfolioChart";
export { RecentSalesWidget, generateMockSales } from "./RecentSalesWidget";
export { TopGainersWidget } from "./TopGainersWidget";
export { HiddenGemsWidget, generateMockGems } from "./HiddenGemsWidget";
export { PriceAlertDialog } from "./PriceAlertDialog";
