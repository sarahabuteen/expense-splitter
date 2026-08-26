import { ButtonLink } from "@/components/ui/button";
import { toSearchParams, type Filters } from "@/lib/filters";

/**
 * CSV downloads, carrying whatever range the report is showing.
 *
 * Lives in the page header rather than a panel: exporting is an action on the
 * page, like Settle up or Add expense elsewhere, not a section of content.
 */
export function ExportLinks({
  groupId,
  filters,
}: {
  groupId: string;
  filters: Filters;
}) {
  const query = toSearchParams(filters);
  const suffix = query ? `&${query}` : "";

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <span className="text-xs text-text-secondary">Export</span>
      <ButtonLink
        href={`/api/groups/${groupId}/export?kind=expenses${suffix}`}
        className="h-9 px-3 text-xs"
      >
        <DownloadIcon />
        Expenses
      </ButtonLink>
      <ButtonLink
        href={`/api/groups/${groupId}/export?kind=settlements${suffix}`}
        className="h-9 px-3 text-xs"
      >
        <DownloadIcon />
        Settlements
      </ButtonLink>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  );
}
