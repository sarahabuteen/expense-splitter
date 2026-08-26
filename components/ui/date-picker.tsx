"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * A calendar popover instead of <input type="date">.
 *
 * The native control renders differently in every browser, ignores the app's
 * palette entirely, and on desktop Chrome is a cramped stepper that is slower
 * than clicking a day.
 *
 * Positioned FIXED against measured coordinates, for the same reason as the
 * currency combobox: it opens inside containers with overflow:hidden, and a
 * body portal would fall behind the create dialog's top layer.
 */
export function DatePicker({
  value,
  onChange,
  max,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  /** ISO date; days after this are not selectable. */
  max?: string;
  id?: string;
}) {
  const reactId = useId();
  const gridId = `${reactId}-grid`;
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => startOfMonth(value));
  const [anchor, setAnchor] = useState<{ left: number; top: number; bottom: number; placement: "below" | "above"; viewportHeight: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const reposition = () => setAnchor(measure(triggerRef.current));
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = monthGrid(cursor);
  const today = isoToday();

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setAnchor(measure(triggerRef.current));
          setCursor(startOfMonth(value));
          setOpen((v) => !v);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-bg-primary px-3 text-sm transition-colors hover:border-accent"
      >
        <CalendarIcon />
        <span className="tabular font-mono">{value}</span>
      </button>

      {open && anchor ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Choose a date"
          style={{
            position: "fixed",
            left: anchor.left,
            ...(anchor.placement === "below"
              ? { top: anchor.bottom + 6 }
              : { bottom: anchor.viewportHeight - anchor.top + 6 }),
          }}
          className="z-50 w-[17.5rem] rounded-lg border border-border bg-surface p-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <IconButton label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))}>
              <ChevronIcon direction="left" />
            </IconButton>
            <p aria-live="polite" className="text-sm font-medium">
              {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
            </p>
            <IconButton label="Next month" onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronIcon direction="right" />
            </IconButton>
          </div>

          <div aria-hidden="true" className="mt-3 grid grid-cols-7 gap-0.5 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[0.625rem] font-medium text-text-tertiary">
                {d}
              </span>
            ))}
          </div>

          <div
            id={gridId}
            role="grid"
            className="mt-1 grid grid-cols-7 gap-0.5"
            onKeyDown={(event) => {
              const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
              if (step === undefined) return;
              event.preventDefault();
              const next = addDays(value, step);
              if (max && next > max) return;
              onChange(next);
              setCursor(startOfMonth(next));
            }}
          >
            {days.map((day, index) => {
              // Leading blanks pad the first week; index is a stable key for
              // them, unlike a random one that would remount every render.
              if (!day) return <span key={`pad-${index}`} />;
              const disabled = Boolean(max && day > max);
              const selected = day === value;
              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  aria-selected={selected}
                  aria-current={day === today ? "date" : undefined}
                  disabled={disabled}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => pick(day)}
                  className={`tabular grid h-8 place-items-center rounded font-mono text-xs transition-colors ${
                    selected
                      ? "bg-accent font-semibold text-white"
                      : disabled
                        ? "cursor-not-allowed text-text-tertiary/40"
                        : day === today
                          ? "border border-accent text-text-primary hover:bg-accent-subtle"
                          : "text-text-primary hover:bg-bg-tertiary"
                  }`}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid size-7 place-items-center rounded text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}

/* ---- date helpers: all UTC, so a timezone never shifts the day ---- */

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonth(iso: string): Date {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(date: Date, delta: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Weeks starting Monday; leading blanks pad the first row. */
function monthGrid(month: Date): (string | null)[] {
  const year = month.getUTCFullYear();
  const m = month.getUTCMonth();
  const first = new Date(Date.UTC(year, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();

  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) =>
      new Date(Date.UTC(year, m, i + 1)).toISOString().slice(0, 10),
    ),
  ];
}

function measure(el: HTMLElement | null) {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const below = viewportHeight - rect.bottom;
  return {
    left: Math.min(rect.left, window.innerWidth - 296),
    top: rect.top,
    bottom: rect.bottom,
    placement: below < 340 && rect.top > below ? ("above" as const) : ("below" as const),
    viewportHeight,
  };
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 text-avatar-amber"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}
