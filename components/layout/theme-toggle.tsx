"use client";

import { useSyncExternalStore } from "react";

import {
  DEFAULT_THEME,
  readTheme,
  subscribeToTheme,
  writeTheme,
  THEMES,
  type Theme,
} from "@/lib/theme";

/**
 * useSyncExternalStore, not useEffect + setState: the React Compiler lint in
 * Next 16 errors on setState-in-effect, and this is what that pattern is for.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => DEFAULT_THEME);

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex rounded-md border border-border bg-surface p-0.5"
    >
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => writeTheme(option)}
          aria-pressed={theme === option}
          title={option[0].toUpperCase() + option.slice(1)}
          className={`grid size-7 place-items-center rounded transition-colors ${
            theme === option
              ? "bg-accent-solid text-accent-foreground"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <span className="sr-only">{option}</span>
          <ThemeIcon theme={option} />
        </button>
      ))}
    </div>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "size-3.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (theme === "system") {
    return (
      <svg {...props}>
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    );
  }
  if (theme === "light") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
