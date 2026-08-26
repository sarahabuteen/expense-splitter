/**
 * Member avatar colours, matching the official design.
 *
 * Against the near-monochrome graphite UI these are the one place colour pops,
 * so member identity reads instantly. Balance direction is carried separately
 * by the success/error tokens plus a sign and a verb, so a member's colour is
 * never the thing communicating money.
 */
export const AVATAR_COLORS = [
  "indigo",
  "amber",
  "pink",
  "teal",
  "violet",
  "orange",
  "cyan",
  "emerald",
  "rose",
  "blue",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

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
