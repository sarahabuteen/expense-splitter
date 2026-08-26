"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";

/**
 * Categories as icon chips rather than a <select>.
 *
 * They each have an icon already, and picking one is a single tap instead of
 * open-scan-select. The icons are the same ones the ledger uses, so what you
 * choose here is what you will recognise there.
 *
 * A new category is created inline: leaving the form to add one, then coming
 * back to find your half-typed expense gone, is a worse trade than a text field
 * appearing in place.
 */
export function CategoryPicker({
  value,
  onChange,
  categories,
  onCreate,
}: {
  value: string;
  onChange: (next: string) => void;
  categories: string[];
  onCreate?: (name: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const name = draft.trim();
    if (!name || !onCreate) return;
    setPending(true);
    setError(null);
    try {
      await onCreate(name);
      onChange(name);
      setDraft("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that category.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5">
        {categories.map((category) => {
          const selected = value === category;
          return (
            <button
              key={category}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border pe-3 ps-1.5 text-xs transition-colors ${
                selected
                  ? "border-accent bg-accent-subtle font-medium text-text-primary"
                  : "border-border text-text-secondary hover:border-accent hover:text-text-primary"
              }`}
            >
              <CategoryIcon category={category} size="sm" />
              {category}
            </button>
          );
        })}

        {onCreate && !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-border px-3 text-xs text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          >
            <span aria-hidden="true">+</span>
            New category
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">New category name</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter would submit the expense form otherwise.
                if (e.key === "Enter") {
                  e.preventDefault();
                  void create();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              autoFocus
              placeholder="e.g. Tips"
              className="h-9 w-full min-w-32 rounded-md border border-border bg-bg-primary px-3 text-sm transition-colors focus:border-accent"
            />
          </label>
          <Button
            type="button"
            onClick={() => void create()}
            disabled={pending || draft.trim() === ""}
            className="h-9 px-3 text-xs"
          >
            {pending ? "Adding…" : "Add"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setError(null);
            }}
            className="h-9 px-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-owe">
          {error}
        </p>
      ) : null}
    </div>
  );
}
