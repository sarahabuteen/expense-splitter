import { Avatar } from "@/components/ui/avatar";

/**
 * A working four-way split control with no JavaScript.
 *
 * Real radio inputs hold the state, `:has()` reads it, and the four panels
 * cross-fade in a single grid cell. That means arrow-key navigation, focus
 * rings, and screen-reader announcements are the platform's own — nothing to
 * reimplement, and nothing to hydrate.
 *
 * The expense is the Dead Sea resort from the demo above, in dinars. A dinar
 * is a thousand fils, so JOD carries three decimals, and every mode below was
 * produced by `allocate()` in `lib/money.ts` rather than typed out: all four
 * sum to exactly JOD 480.000, so a visitor who adds up the column gets the
 * right answer.
 */

type Row = {
  name: string;
  color: "indigo" | "amber" | "pink" | "teal";
  amount: string;
  note: string;
  /** Bar width relative to the largest share in this mode. */
  share: number;
};

type Mode = {
  id: "equal" | "shares" | "exact" | "percent";
  label: string;
  hint: string;
  rows: Row[];
};

const MODES: Mode[] = [
  {
    id: "equal",
    label: "Equally",
    hint: "JOD 480.000 divided by four. The fast path, and the default.",
    rows: [
      { name: "Omar Hassan", color: "indigo", amount: "JOD 120.000", note: "a quarter", share: 1 },
      { name: "Lina Haddad", color: "teal", amount: "JOD 120.000", note: "a quarter", share: 1 },
      { name: "Yousef Nasser", color: "amber", amount: "JOD 120.000", note: "a quarter", share: 1 },
      { name: "Rana Khalil", color: "pink", amount: "JOD 120.000", note: "a quarter", share: 1 },
    ],
  },
  {
    id: "shares",
    label: "Shares",
    hint: "Two rooms, so two of them carry a double share.",
    rows: [
      { name: "Omar Hassan", color: "indigo", amount: "JOD 160.000", note: "2 shares", share: 1 },
      { name: "Lina Haddad", color: "teal", amount: "JOD 160.000", note: "2 shares", share: 1 },
      { name: "Yousef Nasser", color: "amber", amount: "JOD 80.000", note: "1 share", share: 0.5 },
      { name: "Rana Khalil", color: "pink", amount: "JOD 80.000", note: "1 share", share: 0.5 },
    ],
  },
  {
    id: "exact",
    label: "Exact",
    hint: "Type the amounts straight in when the bill already breaks them out.",
    rows: [
      { name: "Omar Hassan", color: "indigo", amount: "JOD 140.000", note: "entered", share: 1 },
      { name: "Lina Haddad", color: "teal", amount: "JOD 140.000", note: "entered", share: 1 },
      { name: "Yousef Nasser", color: "amber", amount: "JOD 100.000", note: "entered", share: 0.714 },
      { name: "Rana Khalil", color: "pink", amount: "JOD 100.000", note: "entered", share: 0.714 },
    ],
  },
  {
    id: "percent",
    label: "Percentage",
    hint: "Thirty, thirty, twenty, twenty. Any remainder lands on the first payer.",
    rows: [
      { name: "Omar Hassan", color: "indigo", amount: "JOD 144.000", note: "30%", share: 1 },
      { name: "Lina Haddad", color: "teal", amount: "JOD 144.000", note: "30%", share: 1 },
      { name: "Yousef Nasser", color: "amber", amount: "JOD 96.000", note: "20%", share: 0.667 },
      { name: "Rana Khalil", color: "pink", amount: "JOD 96.000", note: "20%", share: 0.667 },
    ],
  },
];

export function SplitSwitcher() {
  return (
    <div className="lp-split lp-card overflow-hidden rounded-lg border border-border bg-surface">
      {/* The expense being split */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4">
        <span className="text-sm font-semibold">Dead Sea resort (2 nights)</span>
        <span className="tabular font-mono text-sm">
          JOD 480.000
          <span className="ms-2 text-xs text-text-tertiary">≈ $677.01</span>
        </span>
      </div>

      <fieldset className="border-0 px-5 pt-4">
        <legend className="sr-only">Split method</legend>
        <div className="flex flex-wrap gap-2">
          {MODES.map((mode) => (
            <label
              key={mode.id}
              className="lp-split-option inline-flex items-center rounded-full border border-border bg-bg-primary px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-bg-tertiary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
            >
              <input
                type="radio"
                name="lp-split"
                id={`lp-split-${mode.id}`}
                defaultChecked={mode.id === "equal"}
                className="sr-only"
              />
              {mode.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="lp-split-panels px-5 pb-5 pt-4">
        {MODES.map((mode) => (
          <div key={mode.id} className={`lp-split-panel lp-split-panel-${mode.id}`}>
            <ul className="flex flex-col gap-3">
              {mode.rows.map((row) => (
                <li key={row.name} className="flex items-center gap-3">
                  <Avatar name={row.name} color={row.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm">
                        {row.name.split(" ")[0]}
                      </span>
                      <span className="tabular shrink-0 font-mono text-sm font-medium">
                        {row.amount}
                        <span className="ms-2 text-[0.625rem] font-normal text-text-tertiary">
                          {row.note}
                        </span>
                      </span>
                    </span>
                    <span className="mt-1.5 block h-1 rounded-full bg-bg-tertiary">
                      <span
                        className="lp-share-bar block"
                        style={{ "--share": row.share } as React.CSSProperties}
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
              <span
                aria-hidden="true"
                className="grid size-4 shrink-0 place-items-center rounded-full bg-owed-subtle text-owed"
              >
                <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m4 12 5 5L20 6" />
                </svg>
              </span>
              {mode.hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
