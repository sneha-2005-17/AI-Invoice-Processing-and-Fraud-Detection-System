import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./services/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        muted: "hsl(var(--muted))",
        card: "hsl(var(--card))",
        accent: "hsl(var(--accent))",
        destructive: "hsl(var(--destructive))"
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
