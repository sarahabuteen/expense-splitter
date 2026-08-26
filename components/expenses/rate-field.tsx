"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { decimalsFor } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import { convertMinor } from "@/lib/money";

/**
 * The exchange rate for an expense paid in another currency.
 *
 * Two modes. By default the server fetches the day's rate at save time, which
 * is the right default — a rate typed by hand is a liability nobody asked for.
 * Overriding is one click away for the case the spec names: the rate you were
 * actually charged (a card's rate, a cash exchange) differs from the market's.
 *
 * The current rate is fetched when the override is OPENED, not on mount: it is
 * a response to a click, so there is no effect to run and nothing to tear down
 * when the currency changes again.
 */
export function RateField({
  from,
  to,
  totalMinor,
  rate,
  onChange,
}: {
  from: string;
  to: string;
  /** The expense total in `from`, for the live preview. */
  totalMinor: number;
  /** null means "let the server fetch it". */
  rate: number | null;
  onChange: (rate: number | null) => void;
}) {
  const [text, setText] = useState(rate === null ? "" : String(rate));
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function openOverride() {
    setLoading(true);
    setNote(null);
    try {
      // Prefill with the live rate so the field starts from the truth and the
      // user nudges it, rather than facing an empty box.
      const response = await fetch(
        `/api/rates?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      const body = await response.json();
      if (typeof body.rate === "number") {
        setText(String(Number(body.rate.toPrecision(8))));
        onChange(body.rate);
      } else {
        setText("");
        onChange(0);
        setNote("Couldn't reach the rate service. Enter the rate you were charged.");
      }
    } catch {
      setText("");
      onChange(0);
      setNote("Couldn't reach the rate service. Enter the rate you were charged.");
    } finally {
      setLoading(false);
    }
  }

  if (rate === null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-bg-primary px-3 py-2">
        {/* role="status": the fetch happens on a button press and reports back
            only by swapping this text, which is otherwise silent. */}
        <p role="status" className="text-xs text-text-secondary">
          {loading
            ? `Fetching the exchange rate from ${from} to ${to}…`
            : `Paid in ${from}; converted to ${to} at the day's rate when saved.`}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={openOverride}
          disabled={loading}
          className="h-7 shrink-0 px-2 text-xs"
        >
          {loading ? "Checking…" : "Set the rate myself"}
        </Button>
      </div>
    );
  }

  const parsed = Number(text);
  const valid = text.trim() !== "" && Number.isFinite(parsed) && parsed > 0;
  const preview = valid ? convertMinor(totalMinor, from, to, parsed) : null;

  return (
    <div className="rounded-md border border-accent bg-accent-subtle px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <label htmlFor="composer-rate" className="text-xs text-text-secondary">
          1 {from} =
        </label>
        <input
          id="composer-rate"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            const value = Number(next);
            onChange(Number.isFinite(value) && value > 0 ? value : 0);
          }}
          aria-invalid={!valid}
          aria-describedby="composer-rate-note"
          className="tabular h-8 w-32 rounded-md border border-border bg-surface px-2 font-mono text-xs text-text-primary outline-none focus-visible:border-accent"
        />
        <span className="text-xs text-text-secondary">{to}</span>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onChange(null);
            setNote(null);
          }}
          className="ms-auto h-7 px-2 text-xs"
        >
          Use the live rate
        </Button>
      </div>

      <p id="composer-rate-note" role="status" className="mt-1.5 text-xs text-text-secondary">
        {note ??
          (valid && preview !== null ? (
            <>
              {formatMoney(totalMinor, from)} counts as{" "}
              <span className="tabular font-mono text-text-primary">
                {formatMoney(preview, to)}
              </span>{" "}
              in this group. Saved with the expense, so its balance never moves.
            </>
          ) : (
            `Enter a rate greater than zero. ${to} amounts use ${decimalsFor(to)} decimal places.`
          ))}
      </p>
    </div>
  );
}
