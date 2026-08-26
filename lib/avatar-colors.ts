/**
 * Member avatar colours.
 *
 * Ten hues, each at least 5:1 against white in light mode and 7:1 against the
 * page in dark mode. The set deliberately excludes three hue zones:
 *
 *   - teal   (~172deg) — reserved for "you're owed"
 *   - berry  (~345deg) — reserved for "you owe"
 *   - plum   (~318deg) — the brand colour
 *
 * A member whose avatar read as a balance direction would actively mislead, so
 * member identity and financial meaning never share a hue.
 *
 * The sample data in `data/sample-groups.json` ships its own `avatarColor`
 * values (emerald, teal, rose, pink, red among them) which DO collide with the
 * semantic colours. Map incoming members through `avatarColorForIndex` rather
 * than trusting the fixture's hex values.
 */

export const AVATAR_COLORS = [
  "clay",
  "gold",
  "olive",
  "fern",
  "steel",
  "cobalt",
  "indigo",
  "violet",
  "mauve",
  "slate",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

/** Tailwind class for an avatar background, e.g. `bg-avatar-clay`. */
export function avatarBgClass(color: AvatarColor): string {
  return `bg-avatar-${color}`;
}

/**
 * Assigns the first colour not already used in the group, so small groups never
 * repeat. Falls back to wrapping once every hue is taken.
 */
export function nextAvatarColor(taken: readonly AvatarColor[]): AvatarColor {
  const unused = AVATAR_COLORS.find((c) => !taken.includes(c));
  return unused ?? AVATAR_COLORS[taken.length % AVATAR_COLORS.length];
}

/** Deterministic assignment by position — used when seeding fixture data. */
export function avatarColorForIndex(index: number): AvatarColor {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
