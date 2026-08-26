import { strict as assert } from "node:assert";
import { test } from "node:test";

import { formatRelativeTimestamp, formatTimestamp } from "./format";

const NOW = new Date("2026-08-26T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

test("feed timestamps resolve to minutes and hours, not just days", () => {
  // The whole reason this exists: the date-only formatter answers "today" for
  // everything inside 24 hours, which is useless in a feed.
  assert.equal(formatRelativeTimestamp(ago(30_000), NOW), "just now");
  assert.equal(formatRelativeTimestamp(ago(4 * MINUTE), NOW), "4m ago");
  assert.equal(formatRelativeTimestamp(ago(2 * HOUR), NOW), "2h ago");
  assert.equal(formatRelativeTimestamp(ago(23 * HOUR), NOW), "23h ago");
});

test("feed timestamps fall back to days, weeks, months and years", () => {
  assert.equal(formatRelativeTimestamp(ago(DAY), NOW), "yesterday");
  assert.equal(formatRelativeTimestamp(ago(3 * DAY), NOW), "3 days ago");
  assert.equal(formatRelativeTimestamp(ago(8 * DAY), NOW), "last week");
  assert.equal(formatRelativeTimestamp(ago(60 * DAY), NOW), "2 months ago");
  assert.equal(formatRelativeTimestamp(ago(400 * DAY), NOW), "last year");
});

test("a clock skewed into the future reads as just now, not 'in -3 minutes'", () => {
  assert.equal(formatRelativeTimestamp(new Date(NOW.getTime() + 5 * MINUTE).toISOString(), NOW), "just now");
});

test("an unparseable timestamp yields nothing rather than NaN", () => {
  // The date-only formatter produced "NaN years ago" for a full timestamp;
  // this is the guard that stops that class of bug reaching the feed.
  assert.equal(formatRelativeTimestamp("not a date", NOW), "");
  assert.equal(formatTimestamp("not a date"), "");
});

test("the full timestamp keeps the time of day", () => {
  const full = formatTimestamp("2026-08-26T12:00:00Z");
  assert.match(full, /2026/);
  assert.match(full, /August/);
  assert.match(full, /:\d{2}/, "includes a time, not only a date");
});
