import type { Config } from "tailwindcss";

/** Palette steps are CSS variables (see app/globals.css) so the whole UI re-themes for dark mode. */
const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: scale("slate", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        emerald: scale("brand", [50, 100, 200, 600, 700, 800, 900]),
        red: scale("red", [50, 200, 500, 600, 700, 800]),
        amber: scale("amber", [50, 100, 200, 500, 700, 800]),
        sky: scale("sky", [50, 600, 700]),
        rose: scale("rose", [500]),
        surface: "rgb(var(--surface) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-arabic)", '"Segoe UI Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.06), 0 1px 3px rgb(var(--shadow) / 0.04)",
        pop: "0 10px 30px rgb(var(--shadow) / 0.18)",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: { rise: "rise .35s ease-out both", shimmer: "shimmer 1.6s linear infinite" },
    },
  },
  plugins: [],
};

export default config;
