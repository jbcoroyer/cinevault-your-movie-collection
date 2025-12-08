import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import { applyThemeColor } from "@/lib/theme-config";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Appliquer la couleur d'accentuation stockée au montage
  useEffect(() => {
    const savedColor = localStorage.getItem("theme-accent") || "default";
    applyThemeColor(savedColor);
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
