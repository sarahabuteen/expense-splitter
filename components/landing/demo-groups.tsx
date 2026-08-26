import Link from "next/link";

import { AvatarStack } from "@/components/ui/avatar";

/**
 * What is actually behind "Try it as a guest".
 *
 * The five seeded groups, listed rather than described in a sentence. Names,
 * member counts, expense counts and totals all come from
 * `data/sample-groups.json`, converted at the rate stored with each expense, so
 * a visitor who opens the demo finds exactly these numbers.
 *
 * Every row links to the group list rather than to a group: ids are generated
 * per visitor when the demo is seeded, so there is no stable deep link to
 * promise here.
 */

type Group = {
  name: string;
  members: { name: string; color: "indigo" | "amber" | "pink" | "teal" | "violet" }[];
  meta: string;
  total: string;
};

const GROUPS: Group[] = [
  {
    name: "Trip to Japan",
    members: [
      { name: "Alex Chen", color: "indigo" },
      { name: "Jordan Park", color: "amber" },
      { name: "Sam Rivera", color: "pink" },
      { name: "Taylor Kim", color: "teal" },
    ],
    meta: "13 expenses · 3 currencies",
    total: "$2,751.25",
  },
  {
    name: "Apartment 4B",
    members: [
      { name: "Riley Morgan", color: "indigo" },
      { name: "Casey Brooks", color: "amber" },
      { name: "Drew Patel", color: "pink" },
    ],
    meta: "10 expenses · rent and bills",
    total: "$8,367.98",
  },
  {
    name: "Camping Weekend",
    members: [
      { name: "Jake Foster", color: "indigo" },
      { name: "Lily Tran", color: "amber" },
      { name: "Omar Hassan", color: "pink" },
      { name: "Rachel Kim", color: "teal" },
      { name: "Dev Okafor", color: "violet" },
    ],
    meta: "8 expenses · 5 people",
    total: "$553.44",
  },
  {
    name: "Office Lunch Crew",
    members: [
      { name: "Mia Torres", color: "indigo" },
      { name: "Noah Williams", color: "amber" },
      { name: "Priya Sharma", color: "pink" },
      { name: "Ethan Nakamura", color: "teal" },
    ],
    meta: "8 expenses · none settled",
    total: "$367.45",
  },
  {
    name: "Sarah's Birthday Present",
    members: [
      { name: "Olivia Hayes", color: "indigo" },
      { name: "Ben Gutierrez", color: "amber" },
      { name: "Chloe Yun", color: "pink" },
      { name: "Marcus Webb", color: "teal" },
    ],
    meta: "4 expenses · one shared gift",
    total: "$357.49",
  },
];

export function DemoGroups() {
  return (
    <ul className="mx-auto flex max-w-2xl flex-col gap-2 text-start">
      {GROUPS.map((group, i) => (
        <li key={group.name} className="lp-reveal-item" style={{ "--i": i } as React.CSSProperties}>
          <Link
            href="/groups"
            className="lp-group-row flex items-center gap-4 rounded-lg border border-border-subtle bg-surface/70 px-4 py-3"
          >
            {/* Fixed width, or the three, four and five member stacks would
                each start the group name at a different place. */}
            <span className="hidden w-28 shrink-0 sm:block">
              <AvatarStack members={group.members} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {group.name}
              </span>
              <span className="block truncate text-xs text-text-secondary">
                {group.meta}
              </span>
            </span>

            <span className="shrink-0 text-end">
              <span className="tabular block font-mono text-sm font-medium">
                {group.total}
              </span>
              <span className="block text-[0.625rem] text-text-tertiary">
                tracked
              </span>
            </span>

            <svg
              viewBox="0 0 24 24"
              className="lp-group-chevron size-4 shrink-0 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
