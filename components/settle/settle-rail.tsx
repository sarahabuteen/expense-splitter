import { Avatar } from "@/components/ui/avatar";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import type { GroupDetail } from "@/lib/types";

/**
 * Context beside the plan: where you stand, where everyone stands, and what
 * has already been paid.
 *
 * The settle page previously ran one narrow column down a full-width pane,
 * leaving a dead gap that no other page has. This is the same grid the
 * dashboard uses — and the material is genuinely useful here rather than
 * filler: the history is the evidence that the plan is shrinking.
 */
export function SettleRail({ group }: { group: GroupDetail }) {
  const owed = group.yourBalanceMinor > 0;
  const settled = group.viewerSettled;

  const payments = group.activity
    .filter((row) => row.kind === "settlement")
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-xs font-medium text-text-secondary">
          {settled ? "You're square" : owed ? "You are owed" : "You owe"}
        </p>
        <p
          className={`tabular mt-1.5 font-mono text-xl font-semibold leading-none ${
            settled ? "text-text-primary" : owed ? "text-owed" : "text-owe"
          }`}
        >
          {formatMoney(Math.abs(group.yourBalanceMinor), group.currency)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
          {settled
            ? "Nothing left for you to pay or collect."
            : owed
              ? "Others owe you this across the group."
              : "You owe this across the group."}
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Member balances</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {group.members.map((member) => (
            <li key={member.id} className="flex items-center gap-2.5">
              <Avatar name={member.name} color={member.color} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {member.name}
              </span>
              <span
                className={`tabular shrink-0 font-mono text-sm ${
                  member.settled
                    ? "text-text-secondary"
                    : member.balanceMinor > 0
                      ? "text-owed"
                      : "text-owe"
                }`}
              >
                {member.settled
                  ? formatMoney(0, group.currency)
                  : formatSignedMoney(member.balanceMinor, group.currency)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Already paid</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">
            No payments recorded yet. Anything you record will show up here.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {payments.map((payment) =>
              payment.kind === "settlement" ? (
                <li key={payment.id} className="flex items-center gap-2.5">
                  <Avatar
                    name={payment.from}
                    color={payment.fromColor}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs">
                      {payment.from} → {payment.to}
                    </span>
                    <span className="block text-[0.625rem] text-text-secondary">
                      {payment.relativeDate}
                    </span>
                  </span>
                  <span className="tabular shrink-0 font-mono text-xs text-owed">
                    {formatMoney(payment.amountMinor, payment.currency)}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      {children}
    </section>
  );
}
