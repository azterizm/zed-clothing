import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'bg-main': '#101010'
      },
      screens: {
        'category-bp': { raw: '(max-height: 670px)' }
      }
    },
  },
  plugins: [],
} satisfies Config;
