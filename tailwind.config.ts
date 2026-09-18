import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // The patient app's palette, so the two are recognisably one product.
        //
        // 600 is #67b2d8 exactly -- AppColors.primaryColor, the fill of every
        // CustomButton in the app and the colour it writes its links and icons
        // in. 600 rather than some other step because 600 is what this
        // dashboard already reaches for everywhere it means "this colour", so
        // anchoring it here makes every one of those the app's blue at once.
        //
        // 900 is the same blue at the dark end. It is not a second brand
        // colour: it is for the two places the brand cannot go -- small text
        // on a tinted chip, and the focus outline drawn around a button, which
        // is not an outline if it is the colour of the button.
        primary: {
          50: '#f2f7fa',
          100: '#e3eff4',
          200: '#c6e0ee',
          300: '#a8d3e9',
          400: '#8bc4e1',
          500: '#7abcdd',
          600: '#67b2d8',
          700: '#3e9dce',
          800: '#2c80aa',
          900: '#216182',
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
