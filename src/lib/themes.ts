export type Theme = {
  id: string;
  name: string;
  treasure: string;
  stepIcon: string;
  pathBg: string; // tailwind classes for path container
  spaceBg: string;
  spaceActiveBg: string;
};

export const THEMES: Theme[] = [
  {
    id: "treasure-map",
    name: "Treasure Map",
    treasure: "💰",
    stepIcon: "🟫",
    pathBg: "bg-[var(--theme-path-bg)]",
    spaceBg: "bg-[var(--theme-space)]",
    spaceActiveBg: "bg-[var(--theme-space-active)]",
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
