import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Logo } from "@/components/brand/logo";

/**
 * The hero demo: a group priced in dinars, paid for in riyals and dollars.
 *
 * Built from the same components the app renders with rather than being a
 * screenshot, so it stays sharp at any density and follows the visitor's theme.
 *
 * JOD is the interesting choice here, not a decorative one. A dinar is a
 * thousand fils, so it carries THREE decimal places, and the amounts below show
 * that: JOD 453.600, not JOD 453.60. Anything that assumed two would divide
 * these balances by ten. Every figure was computed with `lib/money.ts` and
 * `lib/balances.ts` at the rates stored beside each expense, the four balances
 * sum to exactly zero in both states, and both settle in three payments.
 *
 * The loop: a sixth expense arrives at the top of the ledger and the balances
 * move to match it. The list slides by exactly one row rather than growing, so
 * the whole animation is a transform and never relayouts the card.
 *
 * Decorative: the copy around it says what the product does, so a screen reader
 * gets that instead of a wall of figures.
 */

const MEMBERS = [
  { name: "Omar Hassan", color: "indigo" },
  { name: "Lina Haddad", color: "teal" },
  { name: "Yousef Nasser", color: "amber" },
  { name: "Rana Khalil", color: "pink" },
] as const;

/**
 * Newest first. The first row is the one that arrives mid-loop; before it lands
 * the list is offset by a row, so the five below it are what shows.
 */
const LEDGER = [
  {
    title: "Rainbow Street dinner",
    meta: "Lina paid · split equally",
    category: "Food & Drink",
    native: "SAR 340.00",
    converted: "JOD 64.260",
  },
  {
    title: "Dead Sea resort (2 nights)",
    meta: "Lina paid · split equally",
    category: "Accommodation",
    native: "JOD 480.000",
    converted: null,
  },
  {
    title: "Flights from Riyadh",
    meta: "Omar paid · split equally",
    category: "Transport",
    native: "SAR 2,400.00",
    converted: "JOD 453.600",
  },
  {
    title: "Petra day pass",
    meta: "Yousef paid · split equally",
    category: "Entertainment",
    native: "JOD 200.000",
    converted: null,
  },
  {
    title: "Desert camp dinner",
    meta: "Rana paid · split equally",
    category: "Food & Drink",
    native: "JOD 96.000",
    converted: null,
  },
  {
    title: "eSIM data bundles",
    meta: "Omar paid · split equally",
    category: "Utilities",
    native: "USD $48.00",
    converted: "JOD 34.032",
  },
];

/** Fixed order, so nothing has to change position when the figures change. */
const BALANCES = [
  { name: "Omar Hassan", color: "indigo", before: "+JOD 171.724", after: "+JOD 155.659", owed: true },
  { name: "Lina Haddad", color: "teal", before: "+JOD 164.092", after: "+JOD 212.287", owed: true },
  { name: "Yousef Nasser", color: "amber", before: "−JOD 115.908", after: "−JOD 131.973", owed: false },
  { name: "Rana Khalil", color: "pink", before: "−JOD 219.908", after: "−JOD 235.973", owed: false },
] as const;

/** Cross-fades one figure into another on the shared loop. */
function Swap({ before, after, className }: { before: string; after: string; className?: string }) {
  return (
    <span className={`lp-swap ${className ?? ""}`}>
      <span className="lp-swap-from">{before}</span>
      <span className="lp-swap-to">{after}</span>
    </span>
  );
}

export function AppPreview() {
  return (
    <div
      aria-hidden="true"
      className="lp-window overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-bg-tertiary/40 px-4 py-3 sm:px-5">
        <span className="flex min-w-0 items-center gap-2.5">
          <Logo className="size-4 shrink-0 text-accent" />
          <span className="truncate text-sm font-bold tracking-tight">
            Trip to Amman
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[0.625rem] font-medium text-text-secondary sm:inline-flex">
            <span className="lp-live size-1.5 rounded-full bg-owed" />
            3 currencies
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <AvatarStack members={[...MEMBERS]} />
          <span className="hidden font-mono text-xs text-text-secondary sm:inline">
            JOD
          </span>
        </span>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-[1.5fr_1fr]">
        {/* Ledger */}
        <div className="bg-surface p-4 sm:p-5">
          <p className="mb-3 flex items-center justify-between text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary">
            <span>Ledger</span>
            <Swap
              before="5 expenses"
              after="6 expenses"
              className="font-mono normal-case tracking-normal"
            />
          </p>

          {/* Five rows tall, six rows of content. The list starts offset by one
              row and slides down to zero as the new expense lands, so a row
              leaves the bottom as one enters the top and nothing reflows. */}
          <div className="lp-feed">
            <ul className="lp-feed-track">
              {LEDGER.map((row, i) => (
                <li
                  key={row.title}
                  className={`lp-feed-row flex items-center gap-3 rounded-lg border px-3 ${
                    i === 0
                      ? "lp-feed-new border-accent/45 bg-accent-subtle/40"
                      : "border-border-subtle bg-bg-primary/60"
                  }`}
                >
                  <CategoryIcon category={row.category} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{row.title}</span>
                    <span className="block truncate text-[0.625rem] text-text-secondary">
                      {row.meta}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="tabular block font-mono text-sm font-medium">
                      {row.native}
                    </span>
                    {row.converted ? (
                      <span className="tabular block font-mono text-[0.625rem] text-text-tertiary">
                        {row.converted}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Balance rail */}
        <div className="bg-surface p-4 sm:p-5">
          <p className="mb-3 text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary">
            Balances
          </p>
          <ul className="flex flex-col gap-2.5">
            {BALANCES.map((b) => (
              <li key={b.name} className="flex items-center gap-2.5">
                <Avatar name={b.name} color={b.color} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {b.name.split(" ")[0]}
                </span>
                <Swap
                  before={b.before}
                  after={b.after}
                  className={`tabular shrink-0 justify-items-end font-mono text-sm font-medium ${
                    b.owed ? "text-owed" : "text-owe"
                  }`}
                />
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-lg border border-border bg-bg-primary/60 p-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary">
              Settle up
            </p>
            <p className="mt-1.5 text-sm leading-snug">
              <span className="font-medium">3 payments</span>
              <span className="text-text-secondary"> clear all four.</span>
            </p>
            <span className="mt-2.5 inline-flex h-8 items-center rounded-md bg-accent px-3 text-xs font-semibold text-white">
              Review plan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
