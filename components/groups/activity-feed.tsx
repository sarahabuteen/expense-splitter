"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Feed, FeedEntry } from "@/lib/server/activity";
import type { GroupMember } from "@/lib/types";

/**
 * The activity feed.
 *
 * Paged rather than scrolled infinitely: a history has no natural end, and a
 * button that says how much is left respects the reader more than a page that
 * silently grows under them. The first page is server-rendered, so the feed is
 * complete before any JavaScript runs.
 *
 * Every sentence is composed on the server (lib/server/activity.ts). This
 * component decides nothing about wording.
 */
export function ActivityFeed({
  groupId,
  initial,
  members,
}: {
  groupId: string;
  initial: Feed;
  members: GroupMember[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<FeedEntry[]>(initial.entries);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The pages the user already loaded came from a server render; when that
  // render is replaced (a new expense, another member's change), take its
  // first page again rather than leaving stale rows above fresh ones.
  const [seenInitial, setSeenInitial] = useState(initial.entries);
  if (seenInitial !== initial.entries) {
    setSeenInitial(initial.entries);
    setEntries(initial.entries);
    setCursor(initial.nextCursor);
  }

  /**
   * Poll for other people's changes. The spec asks for "near real time within
   * a reasonable polling interval" — this refreshes the Server Component, so
   * one request returns the whole page's data rather than the feed alone.
   *
   * Paused while the tab is hidden: a background tab polling every half minute
   * is a battery cost nobody agreed to.
   */
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/groups/${groupId}/activity?cursor=${encodeURIComponent(cursor)}`,
      );
      if (!response.ok) throw new Error("failed");
      const page: Feed = await response.json();
      setEntries((current) => [...current, ...page.entries]);
      setCursor(page.nextCursor);
    } catch {
      setError("Couldn't load more. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const colorOf = new Map(members.map((m) => [m.name, m.color]));

  if (entries.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
        <h2 className="text-sm font-semibold">Nothing has happened yet</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-text-secondary">
          Adding an expense, recording a payment, or changing who is in the
          group all show up here.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="overflow-hidden rounded-lg border border-border bg-surface">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-start gap-3 border-b border-border-subtle px-5 py-3.5 last:border-b-0"
          >
            <Avatar
              name={entry.actorName}
              color={colorOf.get(entry.actorName) ?? "indigo"}
              size="xs"
            />

            <p className="min-w-0 flex-1 text-sm leading-relaxed">
              <span className="font-medium">{entry.actorName}</span>{" "}
              <span className="text-text-secondary">{entry.sentence}</span>
            </p>

            <span
              // Relative for scanning, exact on hover — the pattern the
              // guidance asks for.
              title={entry.fullTime}
              className="shrink-0 pt-0.5 text-xs text-text-tertiary"
            >
              {entry.relativeTime}
            </span>
          </li>
        ))}
      </ol>

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}

      {cursor ? (
        <div>
          <Button type="button" variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load older activity"}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">
          That&rsquo;s the whole history.
        </p>
      )}
    </div>
  );
}
