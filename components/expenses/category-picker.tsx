"use client";

import { CategoryIcon } from "@/components/ui/category-icon";

const CATEGORIES = [
  "Food & Drink", "Transport", "Accommodation", "Housing", "Entertainment",
  "Shopping", "Utilities", "Groceries", "Other",
];

/**
 * Categories as icon chips rather than a <select>.
 *
 * There are only nine, they each have an icon already, and picking one is a
 * single tap instead of open-scan-select. The icons are the same ones the
 * ledger uses, so what you choose here is what you will recognise there.
 */
export function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((category) => {
        const selected = value === category;
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category)}
            className={`flex items-center gap-1.5 rounded-full border py-1 pe-2.5 ps-1 text-xs transition-colors ${
              selected
                ? "border-accent bg-accent-subtle text-text-primary"
                : "border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            <span className="scale-75">
              <CategoryIcon category={category} />
            </span>
            {category}
          </button>
        );
      })}
    </div>
  );
}
