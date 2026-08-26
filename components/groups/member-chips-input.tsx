"use client";

import { useRef, useState } from "react";

import { AVATAR_COLORS, type AvatarColor } from "@/lib/avatar-colors";

export type Chip = { key: string; name: string; color: AvatarColor };

/**
 * Names as wrapping chips, the way an email "To:" field works.
 *
 * This is what lets the whole of group creation fit in one modal. Ten members
 * as full-width rows is ~560px and forces a scroll container; ten as chips is
 * about three wrapped lines. It is also faster to enter: type, Enter, type,
 * Enter, without ever leaving the keyboard.
 *
 * No email field here on purpose. Requiring an address for every person is the
 * most-criticised part of the incumbent's flow, and it is not needed to split
 * anything — email can be added later in group settings for people who want to
 * sign in.
 */
export function MemberChipsInput({
  chips,
  onChange,
  id,
  describedBy,
}: {
  chips: Chip[];
  onChange: (next: Chip[]) => void;
  id: string;
  describedBy?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const name = raw.trim().replace(/,$/, "").trim();
    if (!name) return;

    if (chips.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError(`${name} is already in this group.`);
      return;
    }
    onChange([
      ...chips,
      {
        key: `${name}-${chips.length}`,
        name,
        color: AVATAR_COLORS[chips.length % AVATAR_COLORS.length],
      },
    ]);
    setDraft("");
    setError(null);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter would submit the surrounding form.
      event.preventDefault();
      commit(draft);
      return;
    }
    // Backspace on an empty field removes the last chip — the behaviour
    // everyone already expects from a recipients field.
    if (event.key === "Backspace" && draft === "" && chips.length > 1) {
      event.preventDefault();
      onChange(chips.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        // Clicking anywhere in the box focuses the input, so the whole thing
        // behaves like one field rather than a box containing a small input.
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg-primary p-1.5 focus-within:border-accent"
      >
        {chips.map((chip, i) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1.5 rounded-full bg-bg-tertiary py-0.5 pe-1 ps-1"
          >
            <span
              aria-hidden="true"
              className={`grid size-5 place-items-center rounded-full text-[0.625rem] font-semibold text-white ${DOT[chip.color]}`}
            >
              {chip.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm">{chip.name}</span>
            {i === 0 ? (
              <span className="pe-1.5 text-xs text-text-secondary">you</span>
            ) : (
              <button
                type="button"
                onClick={() => onChange(chips.filter((c) => c.key !== chip.key))}
                className="grid size-5 place-items-center rounded-full text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
              >
                <span className="sr-only">Remove {chip.name}</span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => commit(draft)}
          aria-describedby={describedBy}
          placeholder={chips.length <= 1 ? "Type a name, press Enter" : "Add another"}
          className="h-7 min-w-32 flex-1 bg-transparent px-1.5 text-sm outline-none"
        />
      </div>

      {/* Count is announced rather than left purely visual. */}
      <p aria-live="polite" className="sr-only">
        {chips.length} {chips.length === 1 ? "person" : "people"} in this group.
      </p>

      {error ? (
        <p role="alert" className="text-xs font-medium text-owe">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Literal class names — Tailwind cannot see `bg-avatar-${color}`. */
const DOT: Record<AvatarColor, string> = {
  indigo: "bg-avatar-indigo",
  amber: "bg-avatar-amber",
  pink: "bg-avatar-pink",
  teal: "bg-avatar-teal",
  violet: "bg-avatar-violet",
  orange: "bg-avatar-orange",
  cyan: "bg-avatar-cyan",
  emerald: "bg-avatar-emerald",
  rose: "bg-avatar-rose",
  blue: "bg-avatar-blue",
};
