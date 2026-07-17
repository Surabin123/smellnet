/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E1412",
        panel: "#161D1A",
        panelBorder: "#262F2B",
        textPrimary: "#EAF0EC",
        textMuted: "#8FA39A",
        safe: "#4FD1AE",
        warn: "#E8B23D",
        danger: "#E85D3D",
        hazard: "#C23B4F",
      },
      fontFamily: {
        display: ["'Big Shoulders Display'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
