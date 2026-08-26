/**
 * Empty-state illustration: the ghost of the list that will fill this space.
 *
 * Three placeholder rows — icon tile, description, amount — fading out down the
 * stack, drawn in dashed hairlines. It shows the shape of what goes here
 * instead of decorating the gap, which suits a money tool better than a
 * character does: no face, nothing to anthropomorphise, just the structure.
 *
 * Decorative — the heading beside it carries the meaning.
 */
export function EmptyLedgerIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 168 104"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <GhostRow y={4} opacity={1} accent />
      <GhostRow y={40} opacity={0.55} />
      <GhostRow y={76} opacity={0.25} />
    </svg>
  );
}

function GhostRow({
  y,
  opacity,
  accent,
}: {
  y: number;
  opacity: number;
  accent?: boolean;
}) {
  return (
    <g opacity={opacity}>
      {/* Row outline — dashed because the row isn't there yet */}
      <rect
        x="1"
        y={y}
        width="166"
        height="28"
        rx="6"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      {/* Category tile */}
      <rect
        x="11"
        y={y + 7}
        width="14"
        height="14"
        rx="4"
        className={accent ? "fill-accent-subtle" : "fill-bg-tertiary"}
      />
      {/* Description and metadata */}
      <rect
        x="33"
        y={y + 9}
        width="52"
        height="4.5"
        rx="2.25"
        className="fill-bg-tertiary"
      />
      <rect
        x="33"
        y={y + 17}
        width="30"
        height="3.5"
        rx="1.75"
        className="fill-bg-tertiary"
      />
      {/* Amount, right-aligned like the real thing */}
      <rect
        x="127"
        y={y + 11}
        width="30"
        height="6"
        rx="3"
        className={accent ? "fill-accent/25" : "fill-bg-tertiary"}
      />
    </g>
  );
}
