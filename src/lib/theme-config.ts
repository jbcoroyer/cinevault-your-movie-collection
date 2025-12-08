export const ACCENT_COLORS = [
  { name: "Défaut (Zinc)", value: "default", css: null, class: "bg-zinc-900 dark:bg-zinc-100" },
  { name: "Rouge Vif", value: "red", css: "0 72% 51%", class: "bg-red-600" },
  { name: "Orange Brûlé", value: "orange", css: "24 94% 53%", class: "bg-orange-500" },
  { name: "Or Solaire", value: "gold", css: "45 93% 47%", class: "bg-amber-500" },
  { name: "Vert Émeraude", value: "green", css: "142 71% 45%", class: "bg-emerald-600" },
  { name: "Bleu Profond", value: "blue", css: "221 83% 53%", class: "bg-blue-600" },
  { name: "Indigo", value: "indigo", css: "239 84% 67%", class: "bg-indigo-500" },
  { name: "Violet Électrique", value: "violet", css: "262 83% 58%", class: "bg-violet-600" },
  { name: "Rose Bonbon", value: "pink", css: "340 75% 55%", class: "bg-pink-500" },
  { name: "Cyan", value: "cyan", css: "189 94% 43%", class: "bg-cyan-500" },
];

export const applyThemeColor = (colorValue: string) => {
  const root = document.documentElement;
  const color = ACCENT_COLORS.find((c) => c.value === colorValue);

  if (!color || color.value === "default") {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    root.style.removeProperty("--ring");
  } else {
    root.style.setProperty("--primary", color.css!);
    // Pour les couleurs vives, on force le texte en blanc pour la lisibilité
    root.style.setProperty("--primary-foreground", "0 0% 100%");
    root.style.setProperty("--ring", color.css!);
  }
};
