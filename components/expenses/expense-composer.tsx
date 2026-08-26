"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ApiError, groupsApi } from "@/lib/client/api";
import { useAnnounce } from "@/components/a11y/announcer";
import { useGuestGate } from "@/components/auth/guest-gate";

import { Avatar } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CurrencySymbol } from "@/components/ui/currency-symbol";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { CurrencyCombobox } from "@/components/ui/currency-combobox";
import { CategoryPicker } from "./category-picker";
import { SplitEditor } from "./split-editor";
import { SplitPreview } from "./split-preview";
import { RateField } from "./rate-field";
import { AMOUNT_FIELD_ID } from "./add-expense-button";

const DESCRIPTION_FIELD_ID = "composer-description";
import { decimalsFor } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import {
  computeSplits,
  parseAmount,
  splitsToPercentages,
  validateSplits,
  type SplitType,
} from "@/lib/splits";
import type { GroupMember } from "@/lib/types";

/**
 * Adding an expense — the most frequent action in the app.
 *
 * A row that expands in place, NOT a modal: the UI patterns are explicit that
 * modals are wrong for routine actions, and a modal would also hide the ledger
 * you are usually copying an amount from.
 *
 * The fast path is two fields. Everything else has a sensible default, and
 * those defaults are DECLARED in a sentence underneath rather than hidden —
 * each one is a button that opens the full form at the relevant control, so
 * you never have to expand the form just to check what it assumed.
 *
 * UI ONLY: submitting does nothing yet.
 */
export function ExpenseComposer({
  groupId,
  members,
  currency,
  categories,
  editing,
  onCancelEdit,
}: {
  groupId: string;
  members: GroupMember[];
  currency: string;
  categories: string[];
  /** When set, the composer edits this expense instead of creating one. */
  editing?: EditableExpense | null;
  onCancelEdit?: () => void;
}) {
  const router = useRouter();
  const announce = useAnnounce();
  const { requestWrite, isGuest } = useGuestGate();
  const viewer = members.find((m) => m.isViewer) ?? members[0];
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Callers remount this with a `key` when `editing` changes, so initialising
  // from props is enough — no effect syncing state to props.
  const [expanded, setExpanded] = useState(Boolean(editing));
  const [amountText, setAmountText] = useState(() =>
    editing ? majorString(editing.amountMinor, editing.currency) : "",
  );
  const [description, setDescription] = useState(editing?.title ?? "");
  const [expenseCurrency, setExpenseCurrency] = useState(editing?.currency ?? currency);
  const [payerId, setPayerId] = useState(editing?.payerId ?? viewer?.id ?? "");
  const [category, setCategory] = useState(
    editing?.category ?? categories[0] ?? "Other",
  );
  const [date, setDate] = useState(editing?.date ?? today());
  const [splitType, setSplitType] = useState<SplitType>(editing?.splitType ?? "equal");
  const [participants, setParticipants] = useState(() =>
    editing ? editing.splits.map((s) => s.memberId) : members.map((m) => m.id),
  );
  // null = let the server fetch the day's rate. An edit that was booked at a
  // hand-set rate reopens at that rate, so re-saving doesn't silently reprice it.
  const [manualRate, setManualRate] = useState<number | null>(
    editing?.rateIsManual ? editing.exchangeRate : null,
  );
  const [values, setValues] = useState<Record<string, number>>(() =>
    editing ? initialValues(editing) : {},
  );

  const totalMinor = parseAmount(amountText, expenseCurrency) ?? 0;

  /**
   * Validated as you type, not on submit.
   *
   * A disabled Add button tells you something is wrong but not what — and the
   * patterns ask for real-time amount validation specifically. Only complains
   * once you have typed something, so an untouched field is not an error.
   */
  const amountError = (() => {
    const typed = amountText.trim();
    if (typed === "") return null;
    if (parseAmount(typed, expenseCurrency) === null) {
      return `That isn't a valid amount. ${decimalsFor(expenseCurrency) === 0
        ? `${expenseCurrency} has no decimal places.`
        : `Use up to ${decimalsFor(expenseCurrency)} decimal places.`}`;
    }
    if (totalMinor <= 0) return "Enter an amount greater than zero.";
    return null;
  })();
  const payerIndex = Math.max(0, participants.indexOf(payerId));

  // Rebuilt inside each memo rather than shared, so the dependency lists are
  // honest instead of depending on an object that changes every render.
  const splits = useMemo(
    () =>
      computeSplits({
        splitType,
        totalMinor,
        currency: expenseCurrency,
        participants,
        payerIndex,
        values,
      }),
    [splitType, totalMinor, expenseCurrency, participants, payerIndex, values],
  );

  const errors = useMemo(
    () =>
      totalMinor > 0
        ? validateSplits({
            splitType,
            totalMinor,
            currency: expenseCurrency,
            participants,
            payerIndex,
            values,
          })
        : [],
    [splitType, totalMinor, expenseCurrency, participants, payerIndex, values],
  );
  const splitError = errors.find((e) => e.field === "splits");

  /**
   * Switching split type carries the current numbers over rather than
   * clearing them — losing what you typed because you changed how it divides
   * is its own bug.
   */
  function changeSplitType(next: SplitType) {
    if (next === "percentage") {
      setValues(splitsToPercentages(splits, totalMinor));
    } else if (next === "exact") {
      setValues(Object.fromEntries(splits.map((s) => [s.memberId, s.amountMinor])));
    } else if (next === "shares") {
      setValues(Object.fromEntries(participants.map((id) => [id, 1])));
    }
    setSplitType(next);
  }

  async function submit() {
    const body = {
      description: description.trim(),
      amountMinor: totalMinor,
      currency: expenseCurrency,
      date,
      category,
      paidBy: payerId,
      splitType,
      participants,
      values,
      // Omitted unless set, which is what tells the server to fetch one.
      ...(manualRate !== null ? { exchangeRate: manualRate } : {}),
    };

    setPending(true);
    setSubmitError(null);
    try {
      if (editing) {
        await groupsApi.updateExpense(groupId, editing.id, body);
        onCancelEdit?.();
      } else {
        await groupsApi.createExpense(groupId, body);
      }
      // The form empties itself and the totals change behind it; neither is
      // something a screen reader would otherwise report.
      announce(
        `${editing ? "Expense saved" : "Expense added"}: ${description.trim()}, ${formatMoney(
          totalMinor,
          expenseCurrency,
        )}.`,
      );
      // Reset to the fast-path defaults so the next one is two fields again.
      setAmountText("");
      setDescription("");
      setExpanded(false);
      setValues({});
      setSplitType("equal");
      setParticipants(members.map((m) => m.id));
      setExpenseCurrency(currency);
      setManualRate(null);
      // Server Components hold the ledger and every balance, so they have to
      // re-read for the change to appear.
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  const payer = members.find((m) => m.id === payerId);
  const rateNeeded = expenseCurrency !== currency;
  const canSubmit =
    totalMinor > 0 &&
    !amountError &&
    description.trim() !== "" &&
    errors.length === 0 &&
    // An override that has been opened but left blank would otherwise post a
    // zero rate, which the server rejects with a less helpful message.
    !(rateNeeded && manualRate !== null && manualRate <= 0);

  return (
    <section
      aria-label="Add an expense"
      className="rounded-lg border border-border bg-surface"
    >
      {editing ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-accent-subtle px-4 py-2.5">
          <p className="text-xs text-text-primary">
            Editing <span className="font-medium">{editing.title}</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelEdit}
            className="h-7 px-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          // A guest is stopped here, before any request is made.
          requestWrite(editing ? "editing an expense" : "adding an expense", () => {
            void submit();
          });
        }}
      >
        {/* The fast path: amount and description, nothing else.
            Both labels are visible, not sr-only: a placeholder disappears the
            moment you type, so it cannot be the only thing naming a field —
            and the amount is the one field nobody should have to guess at. */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          {/* The amount is the critical data, so it gets the visual weight —
              a joined control with the symbol fixed to the left of the field. */}
          <div className="flex flex-col gap-1.5 sm:w-44">
            <label htmlFor={AMOUNT_FIELD_ID} className="text-xs font-medium text-text-secondary">
              Amount
              <span aria-hidden="true" className="ms-1 text-owe">
                *
              </span>
            </label>
            {/* focus-ring-within: the ring belongs to the joined control, since
                the input inside suppresses its own outline. */}
            <div
              className={`focus-ring-within flex h-10 items-stretch overflow-hidden rounded-md border bg-bg-primary transition-colors ${
                amountError ? "border-owe" : "border-border focus-within:border-accent"
              }`}
            >
              <span className="grid w-11 shrink-0 place-items-center border-e border-border bg-bg-tertiary font-mono text-sm text-text-secondary">
                <CurrencySymbol code={expenseCurrency} />
              </span>
              <input
                id={AMOUNT_FIELD_ID}
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                // decimal, not numeric: numeric hides the decimal point on iOS.
                inputMode="decimal"
                placeholder="0.00"
                aria-required
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? "composer-amount-error" : "composer-summary"}
                className="tabular h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-base outline-none"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor={DESCRIPTION_FIELD_ID} className="text-xs font-medium text-text-secondary">
              What was it for?
              <span aria-hidden="true" className="ms-1 text-owe">
                *
              </span>
            </label>
            <input
              id={DESCRIPTION_FIELD_ID}
              aria-required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner, taxi, tickets…"
              className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-base transition-colors focus:border-accent"
            />
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls="composer-details"
              className="px-3"
            >
              {expanded ? "Less" : "More"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || pending}
              aria-busy={pending}
              className="px-5"
            >
              {pending ? (editing ? "Saving…" : "Adding…") : editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>

        {/* Defaults, stated out loud. Each is a button into the full form. */}
        {submitError ? (
          <p
            role="alert"
            className="mx-4 mb-3 rounded-md border border-owe/30 bg-owe-subtle px-3 py-2 text-sm text-owe"
          >
            {submitError}
          </p>
        ) : null}

        {amountError ? (
          <p
            id="composer-amount-error"
            role="alert"
            className="px-4 pb-3 text-xs font-medium text-owe"
          >
            {amountError}
          </p>
        ) : null}

        {/*
          The defaults, as a row of labelled chips rather than a sentence.
          Underlined words inside prose do not read as controls — a bordered
          chip showing "Paid by · You" says both what the value is and that it
          can be changed.
        */}
        {!expanded ? (
          <div
            id="composer-summary"
            className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle px-4 py-2.5"
          >
            <span className="text-xs text-text-secondary">Defaults:</span>

            <Chip
              label="Paid by"
              onClick={() => setExpanded(true)}
              icon={
                payer ? <Avatar name={payer.name} color={payer.color} size="xs" /> : null
              }
            >
              {payer?.isViewer ? "You" : (payer?.name.split(" ")[0] ?? "Not set")}
            </Chip>

            <Chip
              label="Split"
              onClick={() => setExpanded(true)}
              icon={
                <ChipIcon
                  tone="text-avatar-violet"
                  path="M12 3v18M5 8h14M7 8l-3 6a3 3 0 0 0 6 0zM17 8l-3 6a3 3 0 0 0 6 0z"
                />
              }
            >
              {splitType === "equal" ? "Equally" : capitalise(splitType)}
            </Chip>

            <Chip
              label="Between"
              onClick={() => setExpanded(true)}
              icon={
                <ChipIcon
                  tone="text-avatar-teal"
                  path="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.6a3.5 3.5 0 0 1 0 6.8"
                />
              }
            >
              {participants.length === members.length
                ? `Everyone (${members.length})`
                : `${participants.length} of ${members.length}`}
            </Chip>

            <Chip
              label="When"
              onClick={() => setExpanded(true)}
              icon={
                <ChipIcon
                  tone="text-avatar-amber"
                  path="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1"
                />
              }
            >
              {friendlyDate(date)}
            </Chip>

            <Chip
              label="Category"
              onClick={() => setExpanded(true)}
              icon={<CategoryIcon category={category} size="sm" />}
            >
              {category}
            </Chip>
          </div>
        ) : null}

        {!expanded && totalMinor > 0 ? (
          <div className="border-t border-border-subtle px-4 py-3">
            <SplitPreview
              members={members}
              splits={splits}
              currency={expenseCurrency}
              totalMinor={totalMinor}
            />
          </div>
        ) : null}

        {expanded ? (
          <div id="composer-details" className="flex flex-col gap-5 border-t border-border p-4">
            {/* Payer, currency and date on one line: three settings that are
                each usually a single glance. */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Field label="Who paid" className="min-w-0 flex-1">
                {/* Avatar chips, not a dropdown — the patterns call for visual
                    member selection, and it makes a wrong payer obvious. */}
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayerId(m.id)}
                      aria-pressed={payerId === m.id}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full border pe-3 ps-1.5 text-xs transition-colors ${
                        payerId === m.id
                          ? "border-accent bg-accent-subtle font-medium text-text-primary"
                          : "border-border text-text-secondary hover:border-accent hover:text-text-primary"
                      }`}
                    >
                      <Avatar name={m.name} color={m.color} size="xs" />
                      {m.isViewer ? "You" : m.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Currency" htmlFor="composer-currency" className="sm:w-52">
                <CurrencyCombobox
                  id="composer-currency"
                  name="currency"
                  defaultValue={expenseCurrency}
                  onChange={setExpenseCurrency}
                />
              </Field>

              <Field label="Date" htmlFor="composer-date" className="sm:w-auto">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Almost every expense is logged the same day or the next,
                      so those two are one tap instead of opening a calendar. */}
                  {[
                    { label: "Today", value: today() },
                    { label: "Yesterday", value: yesterday() },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={date === option.value}
                      onClick={() => setDate(option.value)}
                      className={`h-8 rounded-full border px-3 text-xs transition-colors ${
                        date === option.value
                          ? "border-accent bg-accent-subtle font-medium text-text-primary"
                          : "border-border text-text-secondary hover:border-accent hover:text-text-primary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <DatePicker id="composer-date" value={date} max={today()} onChange={setDate} />
                </div>
              </Field>
            </div>

            {expenseCurrency !== currency ? (
              <RateField
                from={expenseCurrency}
                to={currency}
                totalMinor={totalMinor}
                rate={manualRate}
                onChange={setManualRate}
              />
            ) : null}

            <Field label="Category">
              <CategoryPicker
                value={category}
                onChange={setCategory}
                categories={categories}
                onCreate={async (name) => {
                  if (isGuest) throw new Error("Sign up to add your own categories.");
                  await groupsApi.createCategory(groupId, name);
                  // The category list lives in a Server Component.
                  router.refresh();
                }}
              />
            </Field>

            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-medium">Split</h3>
                {totalMinor > 0 ? (
                  <span className="tabular font-mono text-xs text-text-secondary">
                    {formatMoney(totalMinor, expenseCurrency)} total
                  </span>
                ) : null}
              </div>

              <SplitPreview
                members={members}
                splits={splits}
                currency={expenseCurrency}
                totalMinor={totalMinor}
              />

              <SplitEditor
                members={members}
                splitType={splitType}
                onSplitTypeChange={changeSplitType}
                participants={participants}
                onParticipantsChange={setParticipants}
                values={values}
                onValueChange={(id, value) => setValues({ ...values, [id]: value })}
                splits={splits}
                currency={expenseCurrency}
                totalMinor={totalMinor}
                errorId={splitError ? "composer-split-error" : undefined}
              />
              {splitError ? (
                <p
                  id="composer-split-error"
                  role="alert"
                  className="text-xs font-medium text-owe"
                >
                  {splitError.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      ) : (
        <span className="text-sm font-medium">{label}</span>
      )}
      {children}
    </div>
  );
}

function Chip({
  label,
  icon,
  children,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // The label is part of the accessible name, so a screen reader hears
      // "Paid by: change" rather than a bare "You".
      aria-label={`${label}: change`}
      // A fixed height keeps the row even regardless of what each chip holds —
      // an avatar and an icon have different intrinsic sizes.
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-bg-primary pe-3 ps-1.5 text-xs text-text-primary transition-colors hover:border-accent hover:bg-accent-subtle"
    >
      <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium">{children}</span>
    </button>
  );
}

/** One hue per setting, so the row scans as five things, not one grey blur. */
function ChipIcon({ path, tone }: { path: string; tone: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-4 ${tone}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Everything the composer needs to reopen an existing expense. */
export type EditableExpense = {
  id: string;
  title: string;
  amountMinor: number;
  currency: string;
  date: string;
  category: string;
  payerId: string;
  splitType: SplitType;
  exchangeRate: number;
  rateIsManual: boolean;
  splits: {
    memberId: string;
    amountMinor: number;
    percentage: number | null;
    shares: number | null;
  }[];
};

/** Reopens the split in the units it was entered in, not the derived amounts. */
function initialValues(expense: EditableExpense): Record<string, number> {
  if (expense.splitType === "equal") return {};
  return Object.fromEntries(
    expense.splits.map((s) => [
      s.memberId,
      expense.splitType === "percentage"
        ? (s.percentage ?? 0)
        : expense.splitType === "shares"
          ? (s.shares ?? 0)
          : s.amountMinor,
    ]),
  );
}

function majorString(minor: number, currency: string): string {
  const decimals = decimalsFor(currency);
  return (minor / 10 ** decimals).toFixed(decimals);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function friendlyDate(iso: string): string {
  if (iso === today()) return "today";
  if (iso === yesterday()) return "yesterday";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

