/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0e14',
        panel: '#0f1520',
        soft: '#0c121b',
        line: '#1e2a3a',
        neon: '#3ee08a',
        cyan2: '#22d3ee',
        violet2: '#a78bfa',
        amber2: '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        blink: { '0%, 50%': { opacity: 1 }, '50.01%, 100%': { opacity: 0 } },
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'none' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
        'fade-up': 'fade-up 0.6s ease both',
      },
    },
  },
  plugins: [],
};
