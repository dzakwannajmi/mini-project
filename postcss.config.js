/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}", // ✅ penting untuk React
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // biru indigo Tailwind
        danger: "#ef4444", // merah
      },
    },
  },
  plugins: [],
};
