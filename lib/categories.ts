/**
 * Category icons and tints.
 *
 * Icons are Lucide-style single paths at stroke 1.8, matching the icon set the
 * brand kit recommends. The tints are deliberately muted — a category is a
 * scanning aid, not a status, so it must not compete with the money colours.
 */
export type CategoryStyle = { path: string; tint: string; fg: string };

const ICONS: Record<string, CategoryStyle> = {
  "food & drink": {
    path: "M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M15 3c-1.5 1.5-2 3.5-2 5.5S13.5 12 15 12h3V3z M18 12v9",
    tint: "bg-avatar-orange/12",
    fg: "text-avatar-orange",
  },
  transport: {
    path: "M4 15V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8M4 15h16M4 15l-1 4M20 15l1 4M8 11h8M8 19h8",
    tint: "bg-avatar-blue/12",
    fg: "text-avatar-blue",
  },
  accommodation: {
    path: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 18v2M21 18v2M7 10V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3",
    tint: "bg-avatar-violet/12",
    fg: "text-avatar-violet",
  },
  housing: {
    path: "M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5M10 20v-6h4v6",
    tint: "bg-avatar-teal/12",
    fg: "text-avatar-teal",
  },
  entertainment: {
    path: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z M14 5v14",
    tint: "bg-avatar-pink/12",
    fg: "text-avatar-pink",
  },
  shopping: {
    path: "M5 7h14l-1 13H6zM9 7V5a3 3 0 0 1 6 0v2",
    tint: "bg-avatar-amber/12",
    fg: "text-avatar-amber",
  },
  utilities: {
    path: "M13 2 4 14h7l-1 8 9-12h-7z",
    tint: "bg-avatar-cyan/12",
    fg: "text-avatar-cyan",
  },
  groceries: {
    path: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.5L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
    tint: "bg-avatar-emerald/12",
    fg: "text-avatar-emerald",
  },
  other: {
    path: "M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3zM9 8h6M9 12h6M9 16h3",
    tint: "bg-avatar-indigo/12",
    fg: "text-avatar-indigo",
  },
};

const FALLBACK = ICONS.other;

export function categoryStyle(category: string): CategoryStyle {
  return ICONS[category.toLowerCase()] ?? FALLBACK;
}

/** Settlements are visually distinct from expenses, per the spec. */
export const SETTLEMENT_STYLE: CategoryStyle = {
  path: "M4 8h12l-3-3M20 16H8l3 3",
  tint: "bg-owed-subtle",
  fg: "text-owed",
};
