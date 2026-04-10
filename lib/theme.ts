export const THEME_STORAGE_KEY = "lumen-theme";
export const THEME_COLOR_LIGHT = "#f2ede4";
export const THEME_COLOR_DARK = "#0c0907";

// Apply the resolved theme before hydration so the first paint matches user preference.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
