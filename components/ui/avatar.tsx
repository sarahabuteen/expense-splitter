import { initials } from "@/lib/format";
import type { AvatarColor } from "@/lib/avatar-colors";

/**
 * Written out in full, deliberately. Tailwind only sees class names that appear
 * LITERALLY in the source, so `bg-avatar-${color}` would compile to nothing and
 * every avatar would render colourless.
 */
const BG: Record<AvatarColor, string> = {
  indigo: "bg-avatar-indigo",
  amber: "bg-avatar-amber",
  pink: "bg-avatar-pink",
  teal: "bg-avatar-teal",
  violet: "bg-avatar-violet",
  orange: "bg-avatar-orange",
  cyan: "bg-avatar-cyan",
  emerald: "bg-avatar-emerald",
  rose: "bg-avatar-rose",
  blue: "bg-avatar-blue",
};

/**
 * Coloured initials. The member colours are the one place this near-monochrome
 * UI lets colour pop, per the brand kit — and they deliberately avoid the teal
 * and berry hues that mean "owed" and "owe".
 *
 * Decorative by default: the member's name is rendered as text nearby, so
 * announcing the initials again would just be noise.
 */
export function Avatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: AvatarColor;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ${
        size === "sm" ? "size-6 text-[0.625rem]" : "size-8 text-xs"
      } ${BG[color]}`}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping stack for a group's member list. */
export function AvatarStack({
  members,
  max = 4,
}: {
  members: { name: string; color: AvatarColor }[];
  max?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;

  return (
    <span className="flex items-center">
      <span className="flex -space-x-1.5">
        {shown.map((m) => (
          <span key={m.name} className="rounded-full ring-2 ring-surface">
            <Avatar name={m.name} color={m.color} size="sm" />
          </span>
        ))}
      </span>
      {extra > 0 ? <span className="ms-2 text-xs text-text-secondary">+{extra}</span> : null}
      <span className="sr-only">
        {members.length} member{members.length === 1 ? "" : "s"}:{" "}
        {members.map((m) => m.name).join(", ")}
      </span>
    </span>
  );
}
