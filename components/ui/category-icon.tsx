import { categoryStyle, SETTLEMENT_STYLE } from "@/lib/categories";

export function CategoryIcon({
  category,
  settlement = false,
}: {
  category?: string;
  settlement?: boolean;
}) {
  const style = settlement ? SETTLEMENT_STYLE : categoryStyle(category ?? "other");

  return (
    <span
      aria-hidden="true"
      className={`grid size-9 shrink-0 place-items-center rounded-md ${style.tint} ${style.fg}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={style.path} />
      </svg>
    </span>
  );
}
