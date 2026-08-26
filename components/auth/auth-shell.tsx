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
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-12">
      <Backdrop />

      <div className="relative w-full max-w-[25rem]">
        <Link
          href="/"
          className="mx-auto mb-7 flex w-fit items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
        >
          <Logo className="size-7 text-brand" />
          <span className="text-lg font-bold tracking-tight">Expense Splitter</span>
        </Link>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-md sm:p-7">
          <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-sm text-ink-muted">{footer}</p>
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
            "radial-gradient(42rem 30rem at 15% -5%, var(--brand-soft), transparent 65%), radial-gradient(38rem 28rem at 95% 105%, var(--brand-soft), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
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
