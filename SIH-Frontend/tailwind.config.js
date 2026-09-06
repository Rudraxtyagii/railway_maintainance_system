/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rail: {
          950: '#071526',
          900: '#0d223a',
          850: '#112b48',
          800: '#173a5e',
          700: '#1e4d7d',
          600: '#2563a0',
          500: '#357ebd',
          400: '#60a5fa',
          300: '#93c5fd',
          200: '#bfdbfe',
          100: '#dbeafe',
          50: '#eff6ff',
        },
        ir: {
          saffron: '#f97316',
          gold: '#eab308',
          navy: '#0b2341',
          crimson: '#dc2626',
          emerald: '#059669',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 2px 6px -1px rgba(13, 34, 58, 0.08), 0 2px 4px -2px rgba(13, 34, 58, 0.06)',
        'elevated': '0 10px 25px -5px rgba(13, 34, 58, 0.12), 0 8px 10px -6px rgba(13, 34, 58, 0.08)',
      }
    },
  },
  plugins: [],
}
