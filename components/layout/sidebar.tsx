"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "./account-menu";
import { useNewGroup } from "@/components/groups/new-group-dialog";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import type { Account } from "@/lib/server/account";
import type { GroupSummary } from "@/lib/types";

/**
 * Primary navigation: the group list, per the UI patterns.
 *
 * Each row carries its own balance, so "where do I stand everywhere" is
 * answered without navigating — which is the question people actually open the
 * app to ask.
 */
export function Sidebar({
  groups,
  account,
  isGuest,
}: {
  groups: GroupSummary[];
  account: Account | null;
  isGuest: boolean;
}) {
  const pathname = usePathname();
  const { open } = useNewGroup();
  // The demo group a guest lands on lives at /guest, so the rail links there
  // instead of to an id nobody can read. Its own subpages are unchanged.
  const guestLandingId = isGuest ? groups[0]?.id : undefined;

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
        <div className="flex items-center justify-between gap-2 pb-2 pe-1.5 ps-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Groups
          </h2>
          <button
            type="button"
            onClick={open}
            className="-me-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <PlusIcon />
            Add
          </button>
        </div>
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
            const isGuestLanding = group.id === guestLandingId;
            const href = isGuestLanding ? "/guest" : `/groups/${group.id}`;
            const active =
              pathname.startsWith(`/groups/${group.id}`) ||
              (isGuestLanding && pathname === "/guest");
            const settled = group.yourBalanceSettled;

            return (
              <li key={group.id}>
                <Link
                  href={href}
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
        {/* Empty rail: creating is the only useful action, so it stays a full
            button here as well as the "+" above. */}
        {groups.length === 0 ? (
          <button
            type="button"
            onClick={open}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <PlusIcon />
            New group
          </button>
        ) : null}

        <AccountMenu account={account} />
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
