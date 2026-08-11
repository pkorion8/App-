import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "vs-bg": withOpacity("--vs-color-bg"),
        "vs-bg-subtle": withOpacity("--vs-color-bg-subtle"),
        "vs-fg": withOpacity("--vs-color-fg"),
        "vs-fg-muted": withOpacity("--vs-color-fg-muted"),
        "vs-border": withOpacity("--vs-color-border"),
        "vs-primary": withOpacity("--vs-color-primary"),
        "vs-primary-fg": withOpacity("--vs-color-primary-fg"),
        "vs-danger": withOpacity("--vs-color-danger"),
        "vs-success": withOpacity("--vs-color-success"),
        "vs-warning": withOpacity("--vs-color-warning"),
      },
      borderRadius: {
        "vs-sm": "var(--vs-radius-sm)",
        "vs-md": "var(--vs-radius-md)",
        "vs-lg": "var(--vs-radius-lg)",
      },
      fontFamily: {
        sans: ["var(--vs-font-sans)"],
      },
    },
  },
  plugins: [],
};

export default config;
