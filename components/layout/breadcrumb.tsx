import Link from "next/link";

type Crumb = { label: string; href?: string };

/** Location indicator, per the accessibility checklist's "Groups > Trip to Japan". */
export function Breadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
        {trail.map((crumb, i) => (
          <li key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 ? (
              <span aria-hidden="true" className="text-border">
                /
              </span>
            ) : null}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-text-primary"
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-text-primary">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
