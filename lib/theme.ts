export const THEME_KEY = "expense-splitter-theme";
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Three states, not two. "System" must be a real, selectable option rather than
 * merely the initial default — otherwise choosing light once permanently opts
 * you out of following the OS.
 */
export function readTheme(): Theme {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY);
  return THEMES.includes(stored as Theme) ? (stored as Theme) : "system";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // "system" REMOVES the attribute so the prefers-color-scheme rule takes over.
  // setAttribute/removeAttribute rather than assigning to .dataset: the React
  // Compiler lint forbids mutating a value defined outside a component.
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function writeTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  // `storage` only fires in OTHER tabs, so same-tab listeners need their own event.
  window.dispatchEvent(new Event("expense-splitter:themechange"));
}

export function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("expense-splitter:themechange", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("expense-splitter:themechange", callback);
  };
}

/**
 * Runs before paint, inlined in <head>, to stop a flash of the wrong theme —
 * which the spec lists as an explicit requirement.
 */
export const NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;
