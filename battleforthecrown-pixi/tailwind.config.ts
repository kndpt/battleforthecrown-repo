import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        game: ['Cinzel', 'Georgia', 'serif'],
      },
      colors: {
        kingdom: {
          50: '#fef7ee',
          100: '#fdead4',
          200: '#fbd6a8',
          300: '#f9b97c',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        game: {
          green: { light: '#6ebf49', dark: '#4a8c2a', border: '#3a6c1f' },
          blue: { light: '#5b9bd5', dark: '#2e75b6', border: '#1f5288' },
          red: { light: '#e74c3c', dark: '#c0392b', border: '#a93226' },
          gold: { light: '#f1c40f', dark: '#d4a017', border: '#9e7b0d' },
          stone: { light: '#95a5a6', dark: '#7f8c8d', border: '#5d6d6e' },
        },
        parchment: '#d2b48c',
      },
      boxShadow: {
        'game-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        'game-inset-red': 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'game-pressed': 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 180ms ease-out',
      },
      transitionTimingFunction: {
        // Overshoot léger « pop spring » pour l'ouverture des modales (ModalOverlay).
        'modal-pop': 'cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.text-shadow-game': {
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
        },
      });
    },
  ],
};

export default config;
