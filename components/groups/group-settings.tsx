"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { AddMemberRow } from "./add-member-row";
import { CurrencySelect } from "./currency-select";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import type { GroupSummary } from "@/lib/mock/groups";

const SETTLED_THRESHOLD_MINOR = 1;

/** UI ONLY — nothing here submits. */
export function GroupSettings({ group }: { group: GroupSummary }) {
  const unsettled = group.members.filter(
    (m) => Math.abs(m.balanceMinor) > SETTLED_THRESHOLD_MINOR,
  );
  const hasExpenses = group.expenseCount > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* items-start so the shorter panel does not stretch to match the taller. */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
      <Section title="Details">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-name" className="text-sm font-medium text-text-primary">
              Group name
            </label>
            <input
              id="g-name"
              defaultValue={group.name}
              className="h-10 rounded-md border border-border bg-bg-primary px-3 text-base text-text-primary transition-colors focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-desc" className="text-sm font-medium text-text-primary">
              Description
            </label>
            <textarea
              id="g-desc"
              rows={2}
              defaultValue={group.description}
              className="rounded-md border border-border bg-bg-primary px-3 py-2.5 text-base text-text-primary transition-colors focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-currency" className="text-sm font-medium text-text-primary">
              Default currency
            </label>
            <CurrencySelect
              id="g-currency"
              name="currency"
              defaultValue={group.currency}
              disabled={hasExpenses}
              describedBy={hasExpenses ? "g-currency-locked" : undefined}
            />
            {/*
              Every expense stored a converted amount against this currency.
              Switching it would silently invalidate every balance in the group,
              so it locks once there is anything to invalidate.
            */}
            {hasExpenses ? (
              <p id="g-currency-locked" className="text-xs text-text-secondary">
                Locked because this group already has expenses — every balance was
                calculated against {group.currency}.
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Save changes
            </Button>
          </div>
        </form>
      </Section>

      <Section
        title="Members"
        description="Someone can only be removed once they're settled and have no expense history — removing them otherwise would rewrite what the group spent."
      >
        <ul className="overflow-hidden rounded-md border border-border">
          {group.members.map((m) => {
            const settled = Math.abs(m.balanceMinor) <= SETTLED_THRESHOLD_MINOR;
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 transition-colors last:border-b-0 hover:bg-bg-tertiary/40"
              >
                <Avatar name={m.name} color={m.color} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {m.name}
                  </span>
                  <span className="block truncate text-xs text-text-secondary">
                    {m.email ?? "No email · name only"}
                  </span>
                </span>
                <span
                  className={`tabular shrink-0 font-mono text-sm ${
                    settled
                      ? "text-text-secondary"
                      : m.balanceMinor > 0
                        ? "text-owed"
                        : "text-owe"
                  }`}
                >
                  {settled
                    ? formatMoney(0, group.currency)
                    : formatSignedMoney(m.balanceMinor, group.currency)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!settled || hasExpenses}
                  title={
                    !settled
                      ? `${m.name} has an outstanding balance`
                      : hasExpenses
                        ? `${m.name} appears in this group's expenses`
                        : undefined
                  }
                  className="h-8 px-2 text-xs hover:text-owe"
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>

        {/* Adding happens here rather than in the create dialog: a member list
            has no natural upper bound, and this page can grow. */}
        <div className="mt-3">
          <AddMemberRow
            existingNames={group.members.map((m) => m.name)}
            onAdd={() => {
              // UI only — not wired.
            }}
          />
        </div>
      </Section>

      </div>

      <Section title="Delete group" tone="danger">
        {unsettled.length > 0 ? (
          <p className="text-sm text-text-secondary">
            This group can&rsquo;t be deleted yet —{" "}
            <span className="font-medium text-text-primary">
              {unsettled.length} member{unsettled.length === 1 ? " has" : "s have"}
            </span>{" "}
            an outstanding balance. Settle up first, so nobody loses track of what
            they&rsquo;re owed.
          </p>
        ) : (
          <p className="text-sm text-text-secondary">
            Everyone is settled up. Deleting removes all{" "}
            {group.expenseCount} expenses and their history permanently.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={unsettled.length > 0}
            className="border-owe/40 bg-owe-subtle text-owe hover:bg-owe/10"
          >
            Delete this group
          </Button>
          {unsettled.length > 0 ? (
            <ButtonLink href={`/groups/${group.id}/settle`}>Settle up</ButtonLink>
          ) : null}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  tone = "default",
  children,
}: {
  title: string;
  description?: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border bg-surface ${
        tone === "danger" ? "border-owe/25" : "border-border"
      }`}
    >
      <div className="border-b border-border bg-bg-tertiary/40 px-6 py-4">
        <h2
          className={`text-lg font-semibold tracking-tight ${
            tone === "danger" ? "text-owe" : "text-text-primary"
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
