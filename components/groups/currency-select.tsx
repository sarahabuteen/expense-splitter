import { CURRENCIES } from "@/lib/currencies";

/** Symbol AND code, per the UI patterns — "$" alone is ambiguous across five currencies. */
export function CurrencySelect({
  name,
  defaultValue = "USD",
  disabled,
  id,
  describedBy,
}: {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  describedBy?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      disabled={disabled}
      aria-describedby={describedBy}
      className="h-10 rounded-md border border-border bg-bg-primary px-3 text-base text-text-primary
                 transition-colors focus:border-accent
                 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
