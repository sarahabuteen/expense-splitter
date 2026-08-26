import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/**
 * Frame for the sign-in and sign-up screens.
 *
 * One centred column at every width — an auth screen has a single job, and
 * anything beside the form competes with it. The card gives the form an edge to
 * sit on; the background gives the page some life without asking for attention.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main id="main" className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-12">
      <Backdrop />

      <div className="relative w-full max-w-[25rem]">
        <Link
          href="/"
          className="mx-auto mb-7 flex w-fit items-center gap-2.5 text-text-primary transition-opacity hover:opacity-80"
        >
          <Logo className="size-7 text-accent" />
          <span className="text-lg font-bold tracking-tight">Expense Splitter</span>
        </Link>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-md sm:p-7">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-sm text-text-secondary">{footer}</p>
      </div>
    </main>
  );
}

/**
 * Purely decorative: two soft brand washes and a faint grid, faded out towards
 * the edges. Kept in CSS — no image request, and it costs nothing on mobile.
 */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(42rem 30rem at 15% -5%, var(--accent-subtle), transparent 65%), radial-gradient(38rem 28rem at 95% 105%, var(--accent-subtle), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "3.5rem 3.5rem",
          maskImage:
            "radial-gradient(28rem 22rem at 50% 45%, #000 10%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(28rem 22rem at 50% 45%, #000 10%, transparent 75%)",
        }}
      />
    </div>
  );
}
