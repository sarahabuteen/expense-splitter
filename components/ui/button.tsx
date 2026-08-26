import Link from "next/link";

/**
 * One definition for every button-shaped thing, whether it renders as a
 * <button> or a <Link>.
 *
 * Every variant carries a border — transparent on the solid ones. Without it a
 * bordered button and an unbordered button at the same `h-10` have content
 * boxes 2px apart, so their contents sit at different offsets and the pair
 * looks misaligned even though both are 40px tall.
 */

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "icon";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border " +
  "text-sm font-medium whitespace-nowrap transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border-transparent bg-accent text-white font-semibold hover:bg-accent-hover",
  secondary:
    "border-border bg-surface text-text-primary hover:bg-bg-tertiary",
  ghost:
    "border-transparent bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
};

const SIZES: Record<Size, string> = {
  md: "h-10 px-3.5",
  icon: "size-10 p-0",
};

function classesFor(variant: Variant, size: Size, className?: string) {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ");
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={classesFor(variant, size, className)}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  href,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={classesFor(variant, size, className)}>
      {children}
    </Link>
  );
}
