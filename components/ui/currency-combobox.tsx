"use client";

import { useEffect, useId, useRef, useState } from "react";

import { currencyFor, type Currency } from "@/lib/currencies";
import { CurrencySymbol } from "./currency-symbol";

/**
 * Searchable currency picker.
 *
 * A native <select> with 35 entries means scrolling a long list to find JOD.
 * This filters on code, name and symbol, so "jod", "jordan" and "dinar" all
 * land in the right place.
 *
 * Built on the ARIA combobox pattern rather than a styled div: the
 * accessibility checklist requires dropdowns to be keyboard operable and to
 * announce expanded/collapsed, which a div cannot do. A hidden input carries
 * the value, so this still works as a plain form field.
 */
export function CurrencyCombobox({
  name,
  defaultValue = "USD",
  disabled,
  id,
  describedBy,
  onChange,
}: {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  describedBy?: string;
  onChange?: (code: string) => void;
}) {
  const reactId = useId();
  const inputId = id ?? `${reactId}-input`;
  const listId = `${reactId}-list`;

  const [code, setCode] = useState(defaultValue.toUpperCase());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const selected = currencyFor(code);
  const [matches, setMatches] = useState<Currency[]>([]);

  /**
   * Results come from /api/currencies, so the matching and ranking are decided
   * server-side. Debounced and abortable: a keystroke should not queue a
   * request, and a slow earlier response must not overwrite a newer one.
   */
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/currencies?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const body = await response.json();
        setMatches(body.currencies ?? []);
      } catch {
        // An aborted or failed request leaves the previous results in place,
        // which is better than emptying the list under the user.
      }
    }, query ? 120 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  /**
   * The list is positioned FIXED against measured coordinates, not absolutely
   * inside the field.
   *
   * Both places this is used sit inside an ancestor with overflow:hidden — the
   * settings panel and the create dialog — which clips an absolutely positioned
   * popup. A fixed element is only clipped by a transformed ancestor, and there
   * are none here.
   *
   * Portalling to document.body would also escape the clip, but not inside the
   * create dialog: that renders in the top layer, so a body portal would land
   * BEHIND the modal.
   */
  useEffect(() => {
    if (!open) return;
    const reposition = () => setAnchor(measure(inputRef.current));
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  // Keep the highlighted option in view when arrowing past the fold.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function choose(currency: Currency) {
    setCode(currency.code);
    onChange?.(currency.code);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + delta + matches.length) % Math.max(matches.length, 1));
      return;
    }
    if (event.key === "Enter" && open) {
      // Enter would otherwise submit the surrounding form.
      event.preventDefault();
      const match = matches[activeIndex];
      if (match) choose(match);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery("");
      setOpen(false);
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(0);
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(Math.max(matches.length - 1, 0));
    }
  }

  return (
    <div className="relative">
      {/* The real form value — this works with FormData like any other field. */}
      <input type="hidden" name={name} value={code} />

      <input
        ref={inputRef}
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        autoComplete="off"
        value={open ? query : selected ? label(selected) : code}
        placeholder="Search currencies…"
        onFocus={() => {
          if (disabled) return;
          // Measured in the handler rather than an effect: the React Compiler
          // lint rejects setState during an effect body.
          setAnchor(measure(inputRef.current));
          setOpen(true);
          setQuery("");
          setActiveIndex(0);
        }}
        onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 pe-9 text-base text-text-primary transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary"
      >
        <ChevronIcon open={open} />
      </span>

      {/* Result count, announced without stealing focus. */}
      <p aria-live="polite" className="sr-only">
        {open
          ? `${matches.length} ${matches.length === 1 ? "currency" : "currencies"} available.`
          : ""}
      </p>

      {open && anchor ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Currencies"
          style={{
            position: "fixed",
            left: anchor.left,
            width: anchor.width,
            ...(anchor.placement === "below"
              ? { top: anchor.bottom + 4 }
              : { bottom: anchor.viewportHeight - anchor.top + 4 }),
            maxHeight: anchor.maxHeight,
          }}
          className="z-50 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-secondary">
              {query ? `No currency matches "${query}".` : "Loading currencies…"}
            </li>
          ) : (
            matches.map((currency, index) => (
              <li
                key={currency.code}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={currency.code === code}
                // mousedown, not click: blur would close the list first.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(currency);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${
                  index === activeIndex ? "bg-accent-subtle" : ""
                }`}
              >
                <span className="flex w-10 shrink-0 items-center font-mono text-xs text-text-secondary">
                  <CurrencySymbol code={currency.code} />
                </span>
                <span className="font-medium">{currency.code}</span>
                <span className="truncate text-text-secondary">{currency.name}</span>
                {currency.code === code ? (
                  <span className="ms-auto text-accent">
                    <CheckIcon />
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

type Anchor = {
  left: number;
  top: number;
  bottom: number;
  width: number;
  maxHeight: number;
  placement: "below" | "above";
  viewportHeight: number;
};

/** Flips above the field when there isn't room beneath it. */
function measure(input: HTMLInputElement | null): Anchor | null {
  if (!input) return null;
  const rect = input.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const below = viewportHeight - rect.bottom;
  const above = rect.top;
  const placement = below < 200 && above > below ? "above" : "below";

  return {
    left: rect.left,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    maxHeight: Math.min(256, Math.max(140, (placement === "below" ? below : above) - 16)),
    placement,
    viewportHeight,
  };
}

function label(currency: Currency): string {
  // SAR's symbol is drawn as an icon, so the text label omits it rather than
  // falling back to the superseded glyph.
  if (currency.code === "SAR") return `${currency.code} — ${currency.name}`;
  return `${currency.symbol}  ${currency.code} — ${currency.name}`;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}
