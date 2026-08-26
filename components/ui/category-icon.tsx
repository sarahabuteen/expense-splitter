import { categoryStyle, SETTLEMENT_STYLE } from "@/lib/categories";

export function CategoryIcon({
  category,
  settlement = false,
  size = "md",
}: {
  category?: string;
  settlement?: boolean;
  /** "sm" fits inside a chip without forcing its height. */
  size?: "sm" | "md";
}) {
  const style = settlement ? SETTLEMENT_STYLE : categoryStyle(category ?? "other");

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full ${
        size === "sm" ? "size-5" : "size-9"
      } ${style.tint} ${style.fg}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "sm" ? "size-3.5" : "size-[18px]"}
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
