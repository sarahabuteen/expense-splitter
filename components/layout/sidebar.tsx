"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "./theme-toggle";
import { useNewGroup } from "@/components/groups/new-group-dialog";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import type { GroupSummary } from "@/lib/types";

const SETTLED_THRESHOLD_MINOR = 1;

/**
 * Primary navigation: the group list, per the UI patterns.
 *
 * Each row carries its own balance, so "where do I stand everywhere" is
 * answered without navigating — which is the question people actually open the
 * app to ask.
 */
export function Sidebar({ groups }: { groups: GroupSummary[] }) {
  const pathname = usePathname();
  const { open } = useNewGroup();

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/groups"
        className="flex items-center gap-2.5 px-5 py-5 text-text-primary transition-opacity hover:opacity-80"
      >
        <span className="grid size-7 place-items-center rounded-md bg-accent text-white">
          <Logo className="size-[18px]" />
        </span>
        <span className="font-bold tracking-tight">Expense Splitter</span>
      </Link>

      <nav aria-label="Groups" className="min-h-0 flex-1 overflow-y-auto px-3">
        <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Groups
        </h2>
        {groups.length === 0 ? (
          /* An empty rail is just a void. Ghost rows show where groups will
             land, in the same dashed language as the main empty state. */
          <div className="px-2 pt-1">
            <div aria-hidden="true" className="flex flex-col gap-1.5">
              {[1, 0.55, 0.25].map((opacity) => (
                <div
                  key={opacity}
                  style={{ opacity }}
                  className="flex h-9 items-center gap-2 rounded-md border border-dashed border-border px-2.5"
                >
                  <span className="size-4 rounded-full bg-bg-tertiary" />
                  <span className="h-2 flex-1 rounded-full bg-bg-tertiary" />
                  <span className="h-2 w-8 rounded-full bg-bg-tertiary" />
                </div>
              ))}
            </div>
            <p className="mt-3 px-0.5 text-xs leading-relaxed text-text-secondary">
              Your groups will show up here once you make one.
            </p>
          </div>
        ) : (
        <ul className="flex flex-col gap-0.5">
          {groups.map((group) => {
            const active = pathname.startsWith(`/groups/${group.id}`);
            const settled =
              Math.abs(group.yourBalanceMinor) <= SETTLED_THRESHOLD_MINOR;

            return (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center justify-between gap-3 rounded-md py-2 pe-3 ps-3 text-sm transition-colors ${
                    active
                      ? "bg-bg-tertiary font-medium text-text-primary"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  }`}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-accent"
                    />
                  ) : null}
                  <span className="truncate">{group.name}</span>
                  <span
                    className={`tabular shrink-0 font-mono text-xs ${
                      settled
                        ? "text-text-secondary"
                        : group.yourBalanceMinor > 0
                          ? "text-owed"
                          : "text-owe"
                    }`}
                  >
                    {settled
                      ? formatMoney(0, group.currency)
                      : formatSignedMoney(group.yourBalanceMinor, group.currency)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        )}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={open}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            groups.length === 0
              ? "justify-center bg-accent text-white hover:bg-accent-hover"
              : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          }`}
        >
          <PlusIcon />
          New group
        </button>
        <div className="mt-2 flex items-center justify-between px-3 py-1">
          <span className="text-xs text-text-secondary">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
