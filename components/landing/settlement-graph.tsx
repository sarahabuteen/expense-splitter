/**
 * The signature animation: six direct debts collapsing into three payments.
 *
 * This is the debt-simplification differentiator drawn out rather than
 * described, for the same Trip to Amman group as the demo in the hero. Both
 * sets of edges are its real answer: the six netted pairwise debts, then the
 * three the greedy simplifier in `lib/balances.ts` produces from them. The
 * amounts are in fils, the dinar's minor unit, and they reconcile every
 * balance to exactly zero.
 *
 * One fifteen-second loop drives everything, so the phases can never drift
 * apart: the tangle draws in, dissolves, and the plan takes its place with a
 * pulse of money running down each wire. Per-edge stagger is an
 * `animation-delay` on that same period, which offsets each line without
 * desynchronising the loop.
 *
 * Every path declares `pathLength="100"`, so one set of dash values animates
 * paths of wildly different lengths identically — no measuring, no JavaScript.
 *
 * At rest — reduced motion, or a browser that runs no animation — the graph
 * settles on the simplified plan, fully drawn. The answer, not the working.
 */

type Node = {
  id: string;
  name: string;
  initial: string;
  x: number;
  y: number;
  color: string;
  /** Names sit above the top row and below the bottom row. */
  labelY: number;
  /** Creditors — their ring flashes as a payment lands. */
  receives?: boolean;
};

const NODES: Node[] = [
  { id: "omar", name: "Omar", initial: "OH", x: 130, y: 92, color: "var(--color-avatar-indigo)", labelY: 50, receives: true },
  { id: "lina", name: "Lina", initial: "LH", x: 430, y: 92, color: "var(--color-avatar-teal)", labelY: 50, receives: true },
  { id: "yousef", name: "Yousef", initial: "YN", x: 130, y: 250, color: "var(--color-avatar-amber)", labelY: 300 },
  { id: "rana", name: "Rana", initial: "RK", x: 430, y: 250, color: "var(--color-avatar-pink)", labelY: 300 },
];

/** The six netted pairwise debts. Unlabelled on purpose: the tangle is the point. */
const DIRECT = [
  "M130,250 Q 96,171 130,92",
  "M430,250 Q 300,205 130,92",
  "M130,92 Q 280,58 430,92",
  "M430,250 Q 280,290 130,250",
  "M130,250 Q 250,152 430,92",
  "M430,250 Q 464,171 430,92",
];

/** What the simplifier returns. Sums back to the same four balances. */
/*
 * Amounts are drawn without the currency code: "JOD 212.287" is long enough
 * that at the type size a phone needs it would run outside the viewBox. The
 * caption under the figure carries the currency once instead.
 */
const SIMPLE = [
  {
    d: "M430,250 Q 472,171 430,92",
    amount: "212.287",
    label: "Rana pays Lina 212.287",
    tx: 484,
    ty: 175,
    anchor: "start" as const,
  },
  {
    d: "M130,250 Q 88,171 130,92",
    amount: "131.973",
    label: "Yousef pays Omar 131.973",
    tx: 76,
    ty: 175,
    anchor: "end" as const,
  },
  {
    d: "M430,250 Q 250,136 130,92",
    amount: "23.686",
    label: "Rana pays Omar 23.686",
    tx: 268,
    ty: 138,
    anchor: "middle" as const,
  },
];

export function SettlementGraph() {
  return (
    <figure className="m-0">
      <figcaption className="mb-6 flex items-center justify-center gap-3 text-sm">
        <span className="lp-chip lp-chip-a rounded-full border border-dashed border-border px-3 py-1 text-text-secondary">
          6 direct debts
        </span>
        <span aria-hidden="true" className="text-text-tertiary">
          →
        </span>
        <span className="lp-chip lp-chip-b rounded-full border border-transparent bg-accent-subtle px-3 py-1 font-medium">
          3 payments
        </span>
      </figcaption>

      {/* The box is padded on the left and right of the four nodes: the amount
          labels sit outside the outermost wires, and they grow on narrow
          screens where the whole graph is scaled down. Without the padding
          they would clip. */}
      <svg
        viewBox="-20 20 600 300"
        role="img"
        aria-labelledby="lp-graph-title lp-graph-desc"
        className="w-full"
      >
        <title id="lp-graph-title">
          Six direct debts simplified into three payments
        </title>
        <desc id="lp-graph-desc">
          Omar, Lina, Yousef and Rana owe each other across six netted debts.
          Simplified, three payments in Jordanian dinars clear all of them:{" "}
          {SIMPLE.map((s) => s.label).join("; ")}.
        </desc>

        <defs>
          {/* userSpaceOnUse, so the ramp spans the graph rather than each
              path's own bounding box — which for a near-vertical wire would be
              a sliver, and the colours would not line up between edges. */}
          <linearGradient
            id="lp-wire"
            gradientUnits="userSpaceOnUse"
            x1="130"
            y1="250"
            x2="430"
            y2="92"
          >
            <stop offset="0" stopColor="var(--color-accent)" />
            <stop offset="1" stopColor="var(--lp-teal)" />
          </linearGradient>
        </defs>

        {/* Phase one: the tangle. */}
        <g>
          {DIRECT.map((d, i) => (
            <path
              key={d}
              d={d}
              pathLength={100}
              className="lp-edge-direct"
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </g>

        {/* Phase two: the plan, with money running down each wire. */}
        <g>
          {SIMPLE.map((s, i) => (
            <g key={s.d} style={{ "--i": i } as React.CSSProperties}>
              <path d={s.d} pathLength={100} className="lp-edge-halo" />
              <path d={s.d} pathLength={100} className="lp-edge-simple" />
              <path d={s.d} pathLength={100} className="lp-pulse" />
            </g>
          ))}
        </g>

        {/* Members last, so they mask the ends of every wire. */}
        {NODES.map((n, i) => (
          <g key={n.id} style={{ "--i": i } as React.CSSProperties}>
            {n.receives ? (
              <circle
                cx={n.x}
                cy={n.y}
                r={26}
                className="lp-node-recv"
                style={{ stroke: n.color }}
              />
            ) : null}
            <circle
              cx={n.x}
              cy={n.y}
              r={26}
              className="lp-node-ring"
              style={{ stroke: n.color }}
            />
            <text
              x={n.x}
              y={n.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="lp-node-initial"
              style={{ fill: n.color }}
            >
              {n.initial}
            </text>
            <text
              x={n.x}
              y={n.labelY}
              textAnchor="middle"
              className="lp-node-label"
            >
              {n.name}
            </text>
          </g>
        ))}

        {/* Amounts ride the same loop, appearing once their wire is drawn. */}
        {SIMPLE.map((s, i) => (
          <text
            key={s.amount}
            x={s.tx}
            y={s.ty}
            textAnchor={s.anchor}
            className="lp-amount"
            style={{ "--i": i } as React.CSSProperties}
          >
            {s.amount}
          </text>
        ))}
      </svg>

      <p className="mt-4 text-center text-xs text-text-tertiary">
        Amounts in JOD, the group&rsquo;s currency. A dinar is a thousand fils,
        so it carries three decimals.
      </p>
    </figure>
  );
}
