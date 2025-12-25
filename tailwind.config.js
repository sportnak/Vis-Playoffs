const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom AI Analytics Theme Colors
        'carbon': '#0D1117',          // Carbon Black - body background
        'steel': '#1A1E25',           // Steel Blue-Black - card surface
        'graphite': '#222830',        // Graphite Slate - elevated surface
        'frost': '#E6ECF2',           // Frost White - primary text
        'cool-gray': '#9AA5B1',       // Cool Gray - secondary text
        'ui-border': '#2D333B',       // UI border/divider
        'ui-hover': '#39414A',        // Hover/active background
        'ui-grid': '#4A5562',         // Chart gridlines
        // Accent colors (vibrant, high contrast)
        'cyan': '#00C7FF',            // Electric Cyan
        'neo-green': '#2ECC71',       // Neo Green
        'signal-yellow': '#F9D648',   // Signal Yellow
        'hyper-purple': '#D500F9',    // Hyper Purple
        'highlight-orange': '#FF8A00', // Highlight Orange
        // Semantic colors
        'semantic-good': '#2ECC71',   // Good/Excellent - Neo Green
        'semantic-warning': '#FFC300', // Warning/Fair - Deep Gold
        'semantic-danger': '#E63946',  // Danger/Poor - Accessible Red

        // shadcn/ui CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'roboto-mono': ['"Roboto Mono"', 'monospace'],
        'roboto-flex': ['"Roboto Flex"', 'sans-serif'],
      },
      letterSpacing: {
        'button': '1.6px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
