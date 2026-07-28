import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: "#0a0a0a",
        lime: "#ccff00",
      },
    },
  },
  plugins: [],
};

export default config;
