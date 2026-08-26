import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { CURRENCIES } from "@/lib/currencies";
import { Backdrop } from "@/components/landing/backdrop";
import { AppPreview } from "@/components/landing/app-preview";
import { DemoGroups } from "@/components/landing/demo-groups";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SettlementGraph } from "@/components/landing/settlement-graph";
import { SplitSwitcher } from "@/components/landing/split-switcher";

import "./landing.css";

export const metadata: Metadata = {
  title: "Expense Splitter: split expenses, settle up, stay friends",
  description:
    `Track what everyone paid, in any of ${CURRENCIES.length} currencies, and see exactly ` +
    "who owes whom. Six debts become three payments. No account needed to look around.",
};

/**
 * The landing page.
 *
 * Statically prerendered, and deliberately still a pure server route: there is
 * not one client component on it, so it ships none of the application's
 * JavaScript — only Next's own router runtime, which every route carries.
 * Every animation here is CSS: the drifting backdrop, the scroll-linked
 * reveals, the settlement graph, and the four-way split control that genuinely
 * responds to clicks. That is what holds the two-second time-to-interactive
 * target while the page still moves like a product with a budget behind it.
 *
 * Worth knowing before adding to this route: importing anything with a "use
 * client" boundary — lucide-react included, via `CurrencySymbol` — pulls a
 * chunk onto the page and gives that property away. `npm run build` then
 * reading `clientModules` in `.next/server/app/page_client-reference-manifest.js`
 * is how to check; it should list nothing outside `node_modules/next`.
 *
 * The figures come from the seeded sample data and reconcile against
 * `lib/balances.ts`, so they match what a visitor sees the second they press
 * "Try it as a guest". If the seed changes, these have to change with it.
 *
 * Motion rules, applied throughout: composited properties only, and every
 * animation declared inside `prefers-reduced-motion: no-preference` with the
 * resting state as the finished state. Details in `app/landing.css`.
 */

const HEADLINE: { words: string[]; shine?: boolean }[] = [
  { words: ["Split", "expenses."] },
  { words: ["Settle", "up."], shine: true },
  { words: ["Stay", "friends."] },
];


export default function LandingPage() {
  let wordIndex = 0;

  return (
    <div className="lp flex min-h-full flex-1 flex-col">
      <div className="lp-progress" />
      <Backdrop />

      {/* ---------------------------------------------------------- Nav */}
      {/* The shell stays sticky and full width so the island has something to
          be centred in; it takes no pointer events, or the transparent gutter
          either side of the island would swallow clicks on the page beneath. */}
      <header className="lp-nav-shell pointer-events-none sticky top-0 z-50 px-4 pt-3 sm:pt-4">
        <div className="lp-nav pointer-events-auto mx-auto flex w-full max-w-5xl items-center justify-between gap-4 py-2.5 pe-2.5 ps-5">
          {/* The glass itself: rim light, and a specular band that drifts
              across every twelve seconds. Sits behind the content on its own
              layer, so nothing here can catch a click or a tab stop. */}
          <span aria-hidden="true" className="lp-nav-glass" />

          <span className="flex items-center gap-2.5">
            <Logo className="size-6 text-accent" />
            <span className="font-bold tracking-tight">Expense Splitter</span>
          </span>

          <nav className="hidden items-center gap-7 text-sm text-text-secondary md:flex">
            <a className="transition-colors hover:text-text-primary" href="#how">
              How it works
            </a>
            <a className="transition-colors hover:text-text-primary" href="#settle">
              Settling up
            </a>
            <a className="transition-colors hover:text-text-primary" href="#splitting">
              Splitting
            </a>
          </nav>

          <span className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/groups"
              className="lp-cta inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Open the demo
            </Link>
          </span>
        </div>
      </header>

      <main className="flex-1">
        {/* ------------------------------------------------------- Hero */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-4 pt-12 text-center sm:px-8 sm:pt-16">
          <p
            className="lp-in inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-text-secondary"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            <span aria-hidden="true" className="lp-live size-1.5 rounded-full bg-owed" />
            Live demo, already full of data. No account needed.
          </p>

          {/* Each word is its own inline-block so it can rise, tilt and unblur
              on its own delay. The spaces are real text nodes BETWEEN the
              spans — a trailing space inside an inline-block is trimmed, which
              would run the words together. */}
          <h1
            className="lp-h1 mx-auto mt-7 max-w-3xl text-balance font-extrabold leading-[1.05] tracking-[-0.03em]"
            style={{ fontSize: "var(--lp-display)" }}
          >
            {HEADLINE.map((line) => (
              <span key={line.words.join(" ")} className="block">
                {line.words.map((word, wordInLine) => {
                  const i = wordIndex++;
                  return (
                    <Fragment key={word}>
                      {wordInLine > 0 ? " " : null}
                      <span
                        className="lp-word"
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        {line.shine ? <span className="lp-shine">{word}</span> : word}
                      </span>
                    </Fragment>
                  );
                })}
              </span>
            ))}
          </h1>

          <p
            className="lp-in mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary"
            style={{ "--i": 7 } as React.CSSProperties}
          >
            Log what you paid, in whichever currency you actually paid it. See
            exactly who owes whom, with the working shown, so nobody has to take
            it on trust.
          </p>

          {/* Stacked and equal-width on a phone; side by side from sm up. The
              halo wrapper has to carry the width too, or the primary button
              collapses to its text. */}
          <div
            className="lp-in mt-9 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
            style={{ "--i": 8 } as React.CSSProperties}
          >
            <span className="lp-halo w-full max-w-xs rounded-md sm:w-auto">
              <Link
                href="/groups"
                className="lp-cta inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-7 font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Try it as a guest
              </Link>
            </span>
            <Link
              href="/sign-up"
              className="lp-cta inline-flex h-12 w-full max-w-xs items-center justify-center rounded-md border border-border bg-surface px-7 font-semibold transition-colors hover:bg-bg-tertiary sm:w-auto"
            >
              Create an account
            </Link>
          </div>

          {/* The demo itself, in the hero rather than below it: it is the
              strongest thing on the page, and it should not need a scroll. */}
          <div
            className="lp-in mx-auto mt-12 w-full max-w-5xl text-start sm:mt-14"
            style={{ "--i": 10 } as React.CSSProperties}
          >
            <AppPreview />
          </div>

        </section>

        {/* --------------------------------------------------- How it works */}
        <section
          id="how"
          className="mx-auto mt-[var(--lp-section-gap)] w-full max-w-6xl scroll-mt-24 px-5 sm:px-8"
        >
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
              Three steps, and the third is the point
            </h2>
            <p className="mt-3 text-base leading-relaxed text-text-secondary">
              Tracking is the boring part. Getting your money back is the reason
              you started.
            </p>
          </div>

          <div className="mt-10">
            <HowItWorks />
          </div>
        </section>

        {/* ------------------------------------------- Settlement graph */}
        <section
          id="settle"
          className="mx-auto mt-[var(--lp-section-gap)] w-full max-w-6xl scroll-mt-24 px-5 sm:px-8"
        >
          <div className="lp-reveal grid items-center gap-10 rounded-xl border border-border bg-surface/70 p-6 sm:p-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Debt simplification
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                Six debts. Three payments. Same result.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                The four people above, six expenses between them, and debt
                running in six different directions. A greedy simplifier
                repeatedly matches the largest debtor with the largest creditor
                until nobody is left, which clears the whole group in three
                transfers.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                It does route money between people who never shared a bill,
                which is the loudest complaint anyone has about doing it this
                way. So the app keeps both views, and the direct debts, pair by
                pair, sit one tap behind the clever ones.
              </p>
              <Link
                href="/groups"
                className="lp-cta mt-7 inline-flex h-11 items-center rounded-md border border-border bg-bg-primary px-5 text-sm font-semibold transition-colors hover:bg-bg-tertiary"
              >
                See it on real numbers
              </Link>
            </div>

            <SettlementGraph />
          </div>
        </section>

        {/* ------------------------------------------------ Split switcher */}
        <section
          id="splitting"
          className="mx-auto mt-[var(--lp-section-gap)] w-full max-w-6xl scroll-mt-24 px-5 sm:px-8"
        >
          <div className="lp-reveal grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Splitting
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                Bills are rarely four equal quarters
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                Someone took the bigger room. Someone skipped the wine. Four
                split types cover it, the remainder always lands somewhere you
                can see, and the total has to match the expense before it will
                save.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                Try it. This is a real control, and every mode below adds up to
                exactly JOD 480.000.
              </p>
            </div>

            <SplitSwitcher />
          </div>
        </section>

        {/* ---------------------------------------------------- Final CTA */}
        <section className="mx-auto mt-[var(--lp-section-gap)] w-full max-w-6xl px-5 pb-24 sm:px-8">
          <div className="lp-reveal relative overflow-hidden rounded-xl border border-border bg-surface/70 px-5 py-14 sm:px-10">
            <span aria-hidden="true" className="lp-orb lp-orb-cta" />

            <div className="relative mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                The demo
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                Pick a group. The numbers are already in it.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                20 people, 43 expenses and six recorded settlements are waiting
                across these five. Look around as a guest, and make an account
                later or not at all.
              </p>
            </div>

            <div className="relative mt-10">
              <DemoGroups />
            </div>

            <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <span className="lp-halo w-full max-w-xs rounded-md sm:w-auto">
                <Link
                  href="/groups"
                  className="lp-cta inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-7 font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Try it as a guest
                </Link>
              </span>
              <Link
                href="/sign-up"
                className="lp-cta inline-flex h-12 w-full max-w-xs items-center justify-center rounded-md border border-border bg-bg-primary px-7 font-semibold transition-colors hover:bg-bg-tertiary sm:w-auto"
              >
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-text-tertiary sm:px-8">
          <span className="flex items-center gap-2.5">
            <Logo className="size-4 text-accent" />
            <span>Split expenses. Settle up. Stay friends.</span>
          </span>
          <span className="flex items-center gap-5">
            <Link className="transition-colors hover:text-text-primary" href="/groups">
              Demo
            </Link>
            <Link className="transition-colors hover:text-text-primary" href="/sign-in">
              Sign in
            </Link>
            <Link className="transition-colors hover:text-text-primary" href="/sign-up">
              Create an account
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
