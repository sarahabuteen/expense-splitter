import { SaudiRiyal } from "lucide-react";

import { currencyFor } from "@/lib/currencies";

/**
 * Renders a currency's symbol, as a glyph for most and as an icon for SAR.
 *
 * Saudi Arabia adopted a new riyal symbol in 2025. It has no established
 * Unicode codepoint that renders reliably across platforms, so the old rial
 * sign (﷼) is what most fonts fall back to. Lucide ships the new mark, so SAR
 * draws it rather than showing a superseded glyph.
 *
 * Qatar still uses ﷼ — the new symbol is Saudi-specific, not a Gulf-wide one.
 */
export function CurrencySymbol({
  code,
  className = "",
}: {
  code: string;
  className?: string;
}) {
  const upper = code.toUpperCase();

  if (upper === "SAR") {
    return (
      <SaudiRiyal
        aria-hidden="true"
        strokeWidth={2}
        className={`inline-block size-3.5 ${className}`}
      />
    );
  }

  return (
    <span aria-hidden="true" className={className}>
      {currencyFor(upper)?.symbol ?? upper}
    </span>
  );
}
