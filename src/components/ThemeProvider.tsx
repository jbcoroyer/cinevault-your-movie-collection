import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = Omit<React.ComponentProps<typeof NextThemesProvider>, 'forcedTheme' | 'enableSystem'>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props} forcedTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
