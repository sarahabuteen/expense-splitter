/**
 * Which chart slot a category gets.
 *
 * Assigned in a FIXED alphabetical order, never by rank — the guidance is
 * explicit that colour follows the entity, so filtering the data must not
 * repaint the series that survive.
 *
 * Six validated slots; anything past them folds into a neutral "Other" rather
 * than generating a seventh hue that nothing can tell apart.
 */
export const CHART_SLOTS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
] as const;

export const OTHER_SLOT = "bg-chart-other";
export const OTHER_LABEL = "Other categories";

export type CategoryColors = {
  /** Category -> Tailwind background class. */
  slotFor: (category: string) => string;
  /** The categories that got their own slot, in assignment order. */
  named: string[];
  /** True when at least one category folded into Other. */
  hasOther: boolean;
};

export function assignCategoryColors(categories: string[]): CategoryColors {
  const ordered = [...new Set(categories)].sort();
  const named = ordered.slice(0, CHART_SLOTS.length);
  const slots = new Map(named.map((category, i) => [category, CHART_SLOTS[i]]));

  return {
    slotFor: (category) => slots.get(category) ?? OTHER_SLOT,
    named,
    hasOther: ordered.length > named.length,
  };
}

/** Groups a category into its own name or the Other bucket, for labelling. */
export function labelFor(category: string, colors: CategoryColors): string {
  return colors.named.includes(category) ? category : OTHER_LABEL;
}
