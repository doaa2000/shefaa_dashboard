import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Shefaa brand palette (medical / calm).
        primary: {
          50: '#eef9f7',
          100: '#d6f1ec',
          200: '#aee3da',
          300: '#7ccfc3',
          400: '#48b3a6',
          500: '#2a9688',
          600: '#1f796f',
          700: '#1c615a',
          800: '#1a4e49',
          900: '#17413e',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f7f9fb',
          border: '#e6ebf0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        elevated: '0 8px 24px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
