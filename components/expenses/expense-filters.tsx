"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { DatePicker } from "@/components/ui/date-picker";
import { NO_FILTERS, hasActiveFilters, type Filters } from "@/lib/filters";
import type { GroupMember } from "@/lib/types";

/**
 * The filter panel.
 *
 * Every control is a chip, matching the composer — anything selectable in this
 * app looks the same. Categories are multi-select because "food and transport"
 * is a real question; member and date range are single because they aren't.
 */
export function ExpenseFilters({
  filters,
  onChange,
  members,
  categories,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  members: GroupMember[];
  /** Only categories actually present in this group. */
  categories: string[];
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  function toggleCategory(category: string) {
    set({
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-query" className="text-xs font-medium">
          Search
        </label>
        <input
          id="filter-query"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Description, category or person"
          className="h-10 rounded-md border border-border bg-bg-primary px-3 text-sm transition-colors focus:border-accent"
        />
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium">Category</span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => {
              const selected = filters.categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category)}
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
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">
          Person
          <span className="ms-1.5 font-normal text-text-secondary">
            paid, or included in the split
          </span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {members.map((member) => {
            const selected = filters.memberId === member.id;
            return (
              <button
                key={member.id}
                type="button"
                aria-pressed={selected}
                onClick={() => set({ memberId: selected ? null : member.id })}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border pe-3 ps-1.5 text-xs transition-colors ${
                  selected
                    ? "border-accent bg-accent-subtle font-medium text-text-primary"
                    : "border-border text-text-secondary hover:border-accent hover:text-text-primary"
                }`}
              >
                <Avatar name={member.name} color={member.color} size="xs" />
                {member.isViewer ? "You" : member.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-from" className="text-xs font-medium">
            From
          </label>
          <DatePicker
            id="filter-from"
            value={filters.from ?? ""}
            placeholder="Any date"
            clearable
            onChange={(from) => set({ from: from || null })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-to" className="text-xs font-medium">
            To
          </label>
          <DatePicker
            id="filter-to"
            value={filters.to ?? ""}
            placeholder="Any date"
            clearable
            onChange={(to) => set({ to: to || null })}
          />
        </div>

        {hasActiveFilters(filters) ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(NO_FILTERS)}
            className="h-10 px-3 text-xs"
          >
            Clear all
          </Button>
        ) : null}
      </div>
    </div>
  );
}
