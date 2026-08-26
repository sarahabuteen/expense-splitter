export const THEME_KEY = "expense-splitter-theme";
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Dark is the default: the palette the product is designed around, and what a
 * visitor sees before choosing anything. "System" stays a real, selectable
 * option rather than the initial state, so following the OS is a deliberate
 * choice instead of something you get by accident.
 */
export const DEFAULT_THEME: Theme = "dark";

export function readTheme(): Theme {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_KEY);
  return THEMES.includes(stored as Theme) ? (stored as Theme) : DEFAULT_THEME;
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
 * Runs before paint, inlined in <head>, to stop a flash of the wrong theme,
 * which the spec lists as an explicit requirement.
 *
 * The server already renders `data-theme="dark"`, so an unset preference needs
 * no work here. Only a stored "light" or "system" has to correct the markup,
 * and "system" does it by removing the attribute so the OS rule takes over.
 */
export const NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}else if(t==="system"){document.documentElement.removeAttribute("data-theme")}}catch(e){}})()`;
