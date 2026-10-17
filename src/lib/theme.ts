export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs before React hydrates (inlined in <head> by the root layout) so the
 * page never flashes the wrong theme. Kept as a string because it executes
 * outside the bundle.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
