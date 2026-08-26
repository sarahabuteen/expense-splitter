import { AvatarStack } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyLedgerIllustration } from "@/components/ui/empty-illustration";
import type { GroupSummary } from "@/lib/types";

/**
 * A group that exists but has nothing in it yet.
 *
 * Action-oriented rather than apologetic: one obvious next step, and it still
 * shows who is in the group so the screen does not read as a dead end. The
 * copy adapts to whether there is anyone to split with, because "add an
 * expense" is meaningless on your own.
 */
export function GroupEmptyState({ group }: { group: GroupSummary }) {
  const solo = group.members.length < 2;

  return (
    <div className="w-full rounded-lg border border-border bg-surface px-6 py-14">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <EmptyLedgerIllustration className="w-full max-w-[17rem]" />

        <h2 className="mt-6 text-lg font-bold tracking-tight">
          {solo ? "Nobody to split with yet" : "Nothing to split yet"}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {solo ? (
            <>
              Add the people you&rsquo;re sharing costs with, then log what
              you&rsquo;ve paid for.
            </>
          ) : (
            /* No subunit named on purpose: this group settles in JOD, which
               divides into fils, not cents — and a third of the supported
               currencies are the same. */
            <>
              Add the first expense and we&rsquo;ll work out who owes whom. No
              mental maths, no spreadsheet.
            </>
          )}
        </p>

        <div className="mt-6">
          {solo ? (
            <ButtonLink href={`/groups/${group.id}/settings`} variant="primary">
              Add people
            </ButtonLink>
          ) : (
            <Button type="button" variant="primary">
              Add an expense
            </Button>
          )}
        </div>

        {/* Three things worth knowing before the first entry, so the screen
            teaches rather than just waits. */}
        {solo ? null : (
          <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-text-secondary">
            <Hint>Split equally, by shares, percentages or exact amounts</Hint>
            <Hint>Pay in any currency — we convert at the day&rsquo;s rate</Hint>
          </ul>
        )}

        {solo ? null : (
          <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
            <AvatarStack members={group.members} />
            <p className="text-xs text-text-secondary">
              {group.members.length} people, settling in{" "}
              <span className="font-medium text-text-primary">
                {group.currency}
              </span>
              <span aria-hidden="true" className="mx-1.5 text-border">
                |
              </span>
              <a
                href={`/groups/${group.id}/settings`}
                className="underline underline-offset-2 hover:text-text-primary"
              >
                Manage members
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-3.5 shrink-0 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 12.5 4.5 4.5L19 7" />
      </svg>
      {children}
    </li>
  );
}
