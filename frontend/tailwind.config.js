/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          bg: "#0b0b10",
          surface: "#141420",
          card: "#1a1a28",
          concrete: "#222233",
          border: "#2a2a3d",
          steel: "#3d3d50",
          accent: "#7c3aed",
          glow: "#a78bfa",
          neon: "#c084fc",
          warm: "#f59e0b",
          text: "#e8e8f0",
          muted: "#6b6b80",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      keyframes: {
        driveLeft: {
          "0%": { transform: "translateX(110vw)" },
          "100%": { transform: "translateX(-300px)" },
        },
        driveRight: {
          "0%": { transform: "translateX(-300px)" },
          "100%": { transform: "translateX(110vw)" },
        },
        vBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-1.5px)" },
        },
        gentleSway: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "30%": { transform: "rotate(0.15deg)" },
          "70%": { transform: "rotate(-0.15deg)" },
        },
        windDrift: {
          "0%": { transform: "translateX(calc(100vw + 20px)) translateY(0)" },
          "20%": { transform: "translateX(80vw) translateY(-8px)" },
          "40%": { transform: "translateX(60vw) translateY(4px)" },
          "60%": { transform: "translateX(40vw) translateY(-6px)" },
          "80%": { transform: "translateX(20vw) translateY(3px)" },
          "100%": { transform: "translateX(-20px) translateY(0)" },
        },
        fogDrift: {
          "0%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-30px)" },
          "100%": { transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "drive-left-crawl": "driveLeft 26s linear infinite",
        "drive-left-slow": "driveLeft 18s linear infinite",
        "drive-left-med": "driveLeft 15s linear infinite",
        "drive-left-fast": "driveLeft 11s linear infinite",
        "drive-left-rush": "driveLeft 8s linear infinite",
        "drive-right-crawl": "driveRight 28s linear infinite",
        "drive-right-slow": "driveRight 20s linear infinite",
        "drive-right-med": "driveRight 16s linear infinite",
        "drive-right-fast": "driveRight 13s linear infinite",
        "drive-right-rush": "driveRight 9s linear infinite",
        "v-bounce": "vBounce 0.3s ease-in-out infinite",
        "sway": "gentleSway 8s ease-in-out infinite",
        "fog-drift": "fogDrift 12s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
