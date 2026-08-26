import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Expense Splitter — split expenses, settle up, stay friends",
  description:
    "Track what everyone paid, in any currency, and see exactly who owes whom.",
};

/**
 * The landing page: a short pitch and a looping demo of the actual product
 * loop — log an expense, see the balances, settle in the fewest payments.
 *
 * Statically prerendered. No database call, no images, and no client
 * JavaScript on this route, which is what meets the brief's two-second
 * time-to-interactive target. The demo is markup and CSS, so there is nothing
 * to download and nothing shifts as it loads.
 *
 * The figures are the real seeded ones, so they match what a visitor sees the
 * moment they press "Try it as a guest". If the seed changes, these do too.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <span className="flex items-center gap-2.5">
          <Logo className="size-6 text-accent" />
          <span className="font-bold tracking-tight">Expense Splitter</span>
        </span>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 sm:px-8">
        <section className="pt-10 text-center sm:pt-16">
          <h1 className="animate-rise mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight">
            Split expenses. Settle up. Stay friends.
          </h1>
          <p className="animate-rise delay-1 mx-auto mt-4 max-w-lg text-base leading-relaxed text-text-secondary">
            Log what you paid, in any currency. See exactly who owes whom — with
            the working shown, so nobody has to take it on trust.
          </p>

          {/* Both prominent. Guest leads because almost nobody makes an account
              to look at a demo, and the guest view is the whole product. */}
          <div className="animate-rise delay-2 mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/groups"
              className="inline-flex h-11 items-center rounded-md bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Try it as a guest
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-6 font-semibold transition-colors hover:bg-bg-tertiary"
            >
              Create an account
            </Link>
          </div>
          <p className="animate-rise delay-3 mt-3 text-xs text-text-tertiary">
            No sign-up needed to look around.
          </p>
        </section>

        <Demo />

        <section className="animate-rise delay-2 mx-auto mt-14 max-w-lg text-center">
          <p className="text-sm leading-relaxed text-text-secondary">
            Five sample groups are already loaded — a trip across three
            currencies, a flat share, a lunch club and more. Nothing to set up,
            nothing to sign for.
          </p>
          <Link
            href="/groups"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Try it as a guest
          </Link>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-4xl border-t border-border px-5 py-6 text-xs text-text-tertiary sm:px-8">
        Split expenses. Settle up. Stay friends.
      </footer>
    </div>
  );
}

/**
 * Three scenes on one 15-second loop, stacked in a single grid cell and
 * cross-faded by CSS. Decorative — the copy above already says what the
 * product does, so a screen reader gets that rather than a wall of figures.
 */
function Demo() {
  return (
    <section aria-hidden="true" className="animate-rise delay-4 mt-14">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between gap-4 border-b border-border bg-bg-tertiary/40 px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Logo className="size-4 text-accent" />
            Trip to Japan
          </span>
          <span className="text-xs text-text-secondary">4 members · USD</span>
        </div>

        <div className="grid min-h-[19rem] p-5 sm:min-h-[17rem]">
          <Scene index={1} step="1" title="Log what you paid">
            <ul className="flex flex-col gap-2.5">
              <Row title="Izakaya dinner" meta="Alex paid · shares 2:2:1:1" amount="¥42,600" />
              <Row title="Kyoto ryokan" meta="Taylor paid · exact amounts" amount="¥120,000" />
              <Row title="JR Pass (7-day)" meta="Alex paid · split equally" amount="$236.50" />
            </ul>
            <p className="mt-4 text-xs text-text-secondary">
              Any currency. The rate is stored at the moment you paid, so old
              balances never move.
            </p>
          </Scene>

          <Scene index={2} step="2" title="See who owes what">
            <ul className="flex flex-col gap-2.5">
              <Balance name="Alex Chen" amount="+$216.46" tone="owed" />
              <Balance name="Taylor Kim" amount="+$318.12" tone="owed" />
              <Balance name="Jordan Park" amount="−$219.49" tone="owe" />
              <Balance name="Sam Rivera" amount="−$315.09" tone="owe" />
            </ul>
            <p className="mt-4 text-xs text-text-secondary">
              Every figure traces back to the expenses behind it. Open one and
              see the working.
            </p>
          </Scene>

          <Scene index={3} step="3" title="Settle in the fewest payments">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-bg-tertiary px-2.5 py-1 text-xs text-text-tertiary line-through">
                6 payments
              </span>
              <span aria-hidden="true" className="text-text-tertiary">→</span>
              <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-xs font-medium text-text-primary">
                3 payments
              </span>
            </div>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              <Payment from="Jordan" to="Alex" amount="$216.46" />
              <Payment from="Sam" to="Taylor" amount="$315.09" />
              <Payment from="Jordan" to="Taylor" amount="$3.03" />
            </ul>
            <p className="mt-4 text-xs text-text-secondary">
              Fewer transfers, same result — and the original debts stay one tap
              away.
            </p>
          </Scene>
        </div>
      </div>
    </section>
  );
}

function Scene({
  index,
  step,
  title,
  children,
}: {
  index: 1 | 2 | 3;
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`demo-scene demo-scene-${index}`}>
      <p className="flex items-center gap-2 text-xs font-medium text-text-secondary">
        <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.625rem] font-semibold text-white">
          {step}
        </span>
        {title}
      </p>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

function Row({ title, meta, amount }: { title: string; meta: string; amount: string }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-md border border-border bg-bg-primary px-3.5 py-2.5">
      <span className="min-w-0">
        <span className="block truncate text-sm">{title}</span>
        <span className="block truncate text-[0.625rem] text-text-secondary">{meta}</span>
      </span>
      <span className="tabular shrink-0 font-mono text-sm font-medium">{amount}</span>
    </li>
  );
}

function Balance({
  name,
  amount,
  tone,
}: {
  name: string;
  amount: string;
  tone: "owed" | "owe";
}) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="truncate text-sm">{name}</span>
      <span
        className={`tabular shrink-0 font-mono text-sm font-medium ${
          tone === "owed" ? "text-owed" : "text-owe"
        }`}
      >
        {amount}
      </span>
    </li>
  );
}

function Payment({ from, to, amount }: { from: string; to: string; amount: string }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-md border border-border bg-bg-primary px-3.5 py-2.5">
      <span className="truncate text-sm">
        <span className="font-medium">{from}</span>
        <span className="text-text-secondary"> pays </span>
        <span className="font-medium">{to}</span>
      </span>
      <span className="tabular shrink-0 font-mono text-sm font-medium">{amount}</span>
    </li>
  );
}
