/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Senkai — Training System. Negro + rojo neón, HUD anime/gaming.
        ink: "#F5F5F5",
        paper: "#050505",
        cream: "#000000",
        card: "#0A0A0A",
        maroon: {
          DEFAULT: "#E51E3A",
          dark: "#B4152C",
          light: "#FF2448",
        },
        teal: {
          DEFAULT: "#3AAEEC",
          dark: "#1E7FB8",
          light: "#8AD4F7",
        },
        gold: "#D9A441",
        silver: "#B9C2CC",
        bronze: "#8A5A34",
        muted: "#A0A0A0",
        line: "#1F1F1F",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(229,30,58,0.18), 0 0 22px -8px rgba(255,36,72,0.5)",
        "glow-sm": "0 0 12px rgba(229,30,58,0.18)",
        "glow-teal": "0 0 0 1px rgba(58,174,236,0.2), 0 0 22px -8px rgba(58,174,236,0.5)",
        "glow-gold": "0 0 0 1px rgba(217,164,65,0.25), 0 0 18px -6px rgba(217,164,65,0.6)",
        "glow-silver": "0 0 0 1px rgba(185,194,204,0.3), 0 0 14px -6px rgba(185,194,204,0.55)",
        "glow-bronze": "0 0 0 1px rgba(138,90,52,0.3), 0 0 14px -6px rgba(138,90,52,0.55)",
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      letterSpacing: {
        widest2: "0.25em",
      },
      keyframes: {
        tick: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.85)", opacity: 0.5 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        fillbar: {
          "0%": { width: "0%" },
        },
      },
      animation: {
        tick: "tick 1.6s ease-in-out infinite",
        rise: "rise 0.4s ease-out both",
        pop: "pop 0.25s ease-out both",
      },
      transitionDuration: {
        250: "250ms",
      },
    },
  },
  plugins: [],
};
