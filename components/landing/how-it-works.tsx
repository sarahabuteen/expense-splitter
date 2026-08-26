import { Avatar } from "@/components/ui/avatar";

/**
 * The three steps, each with a working miniature of the thing it describes
 * rather than an icon standing in for it.
 *
 * All three run on one six second loop and are built from the same CSS rules
 * as the rest of the page: composited properties only, and a resting state
 * that is the finished state, so with reduced motion each panel reads as a
 * completed screenshot instead of an empty frame.
 *
 * The figures are the seeded Kyoto ryokan and the four balances it feeds into,
 * so they match the settlement graph further down and the demo behind the
 * button.
 */

/* Each bar is that balance as a share of the largest, so the column is
   comparable at a glance. The four sum to zero, as they must. */
const BALANCES = [
  { name: "Taylor", amount: "+$318.12", width: 100, owed: true },
  { name: "Alex", amount: "+$216.46", width: 68, owed: true },
  { name: "Jordan", amount: "−$219.49", width: 69, owed: false },
  { name: "Sam", amount: "−$315.09", width: 99, owed: false },
] as const;

export function HowItWorks() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      <Step
        index={0}
        step="01"
        title="Log what you paid"
        body="Amount, who paid, how to split. The common case, one payer and an even split, takes three taps. The awkward one still fits on a single screen."
      >
        <Composer />
      </Step>

      <Step
        index={1}
        step="02"
        title="Watch the balances move"
        body="Everyone's position updates as you type, converted into the group's currency. Each figure traces back to the expenses behind it, so you can check the arithmetic instead of trusting it."
      >
        <BalanceBars />
      </Step>

      <Step
        index={2}
        step="03"
        title="Settle up and be done"
        body="Record the payment and the balances clear while you watch. When everybody is square the group says so, rather than leaving you to work it out from a row of zeros."
      >
        <AllSquare />
      </Step>
    </ol>
  );
}

function Step({
  index,
  step,
  title,
  body,
  children,
}: {
  index: number;
  step: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <li
      className="lp-card lp-reveal-item flex flex-col rounded-lg border border-border bg-surface"
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* The miniature. Decorative: the prose below carries the meaning. */}
      <div
        aria-hidden="true"
        className="grid h-40 place-items-center overflow-hidden rounded-t-lg border-b border-border bg-bg-primary/60 px-4"
      >
        {children}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="font-mono text-xs font-semibold text-accent">{step}</span>
        <h3 className="mt-2 text-base font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
      </div>
    </li>
  );
}

/** Step one: the expense composer filling itself in. */
function Composer() {
  return (
    <div className="w-full max-w-[15rem]">
      <ul className="flex flex-col gap-2">
        <li
          className="lp-fill flex items-center justify-between gap-3"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          <span className="text-[0.625rem] text-text-tertiary">Amount</span>
          <span className="flex items-center gap-0.5">
            {/* Revealed a character at a time by a stepped clip, which is paint
                only. Animating width instead would relayout the row. */}
            <span className="lp-type tabular font-mono text-sm font-medium">
              ¥120,000
            </span>
            <span className="lp-caret h-3.5 w-px bg-accent" />
          </span>
        </li>

        <li
          className="lp-fill flex items-center justify-between gap-3"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span className="text-[0.625rem] text-text-tertiary">Paid by</span>
          <span className="flex items-center gap-1.5">
            <Avatar name="Taylor Kim" color="teal" size="xs" />
            <span className="text-sm">Taylor</span>
          </span>
        </li>

        <li
          className="lp-fill flex items-center justify-between gap-3"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <span className="text-[0.625rem] text-text-tertiary">Split</span>
          <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[0.625rem] font-medium">
            Equally
          </span>
        </li>
      </ul>

      <span
        className="lp-save mt-3 grid h-7 place-items-center rounded-md bg-accent text-[0.625rem] font-semibold text-white"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        Save expense
      </span>
    </div>
  );
}

/** Step two: the four balances, laid out the way the app's own rail lays them. */
function BalanceBars() {
  return (
    <ul className="flex w-full max-w-[15.5rem] flex-col gap-2.5">
      {BALANCES.map((balance, i) => (
        <li
          key={balance.name}
          className="grid grid-cols-[2.5rem_1fr_3.75rem] items-center gap-x-2"
          style={{ "--i": i } as React.CSSProperties}
        >
          <span className="truncate text-[0.625rem] text-text-tertiary">
            {balance.name}
          </span>
          <span className="flex">
            <span
              className={`lp-bar ${balance.owed ? "lp-bar-owed" : "lp-bar-owe"}`}
              style={{ width: `${balance.width}%` } as React.CSSProperties}
            />
          </span>
          <span
            className={`tabular text-end font-mono text-[0.625rem] font-medium ${
              balance.owed ? "text-owed" : "text-owe"
            }`}
          >
            {balance.amount}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Step three: the payoff state. */
function AllSquare() {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 48 48" className="size-12" fill="none" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r="21"
          pathLength={100}
          className="lp-square-ring"
        />
        <path
          d="M15 24.5 21.5 31 33 18"
          pathLength={100}
          className="lp-square-tick"
        />
      </svg>
      <span className="lp-square-label text-center">
        <span className="block text-sm font-semibold">Everyone is square</span>
        <span className="tabular mt-0.5 block font-mono text-[0.625rem] text-text-tertiary">
          0 payments outstanding
        </span>
      </span>
    </div>
  );
}
