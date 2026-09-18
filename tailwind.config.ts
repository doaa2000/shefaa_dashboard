import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // The patient app's palette, so the two are recognisably one product.
        //
        // 400 is #67b2d8 exactly -- AppColors.primaryColor in the app, and the
        // light end of the logo's own gradient. The rest of the ramp is that
        // hue at other lightnesses.
        //
        // The brand colour itself carries white text at 2.35:1, which is not
        // readable, so buttons and active states use 600. That is dark enough
        // for white at 4.90:1, past the 4.5 a 14px label needs.
        primary: {
          50: '#f0f6f9',
          100: '#deebf2',
          200: '#b9d9e9',
          300: '#8dc5e2',
          400: '#67b2d8',
          500: '#3c9ccd',
          600: '#2978a0',
          700: '#216182',
          800: '#1b4f6a',
          900: '#153d51',
        },
        // The dark end of the same gradient, which is where the logo finishes.
        accent: {
          50: '#eef4f7',
          100: '#d5e4ea',
          200: '#a9c6d3',
          300: '#75a3b8',
          400: '#4a7f97',
          500: '#356376',
          600: '#265162',
          700: '#1c414f',
        },
        surface: {
          DEFAULT: '#ffffff',
          // Tinted a shade towards the brand rather than left neutral grey, so
          // the page behind the cards belongs to the same palette.
          muted: '#f6f9fb',
          border: '#e3ebf0',
        },
      },
      fontFamily: {
        // Tajawal after Inter: the Latin glyphs still come from Inter, and the
        // Arabic ones from a font that has them.
        sans: ['Inter', 'Tajawal', 'system-ui', 'sans-serif'],
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
