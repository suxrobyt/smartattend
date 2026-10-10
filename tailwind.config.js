/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0f1e',
        surface: { DEFAULT: '#111a2e', 2: '#172340', 3: '#1f2f56' },
        line: 'rgba(148,163,184,0.16)',
        ink: '#e9eef9',
        muted: '#8b97b3',
        brand: { DEFAULT: '#4f8cff', 2: '#22d3ee' },
        ok: '#34d399',
        warn: '#fbbf24',
        bad: '#f87171',
        info: '#60a5fa',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 28px -14px rgba(0,0,0,0.65)',
      },
    },
  },
  plugins: [],
};
