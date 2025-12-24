/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Traditional Moroccan Zellije Colors
        zellije: {
          cobalt: '#0047AB',
          manganese: '#4B0082',
          ochre: '#E3A857',
          emerald: '#006B3C',
          ivory: '#FFFFF0',
          terracotta: '#CC4E3B',
          turquoise: '#30D5C8',
          midnight: '#191970',
        },
        // Dark UI theme inspired by Fez medina at night
        medina: {
          50: '#f7f5f2',
          100: '#e8e4dc',
          200: '#d4cec2',
          300: '#b8b0a0',
          400: '#9c917d',
          500: '#857963',
          600: '#6b6150',
          700: '#564e42',
          800: '#48423a',
          900: '#3f3a34',
          950: '#1a1815',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'zellige-pattern': 'radial-gradient(circle at 25% 25%, rgba(0, 71, 171, 0.03) 0%, transparent 50%)',
        'medina-gradient': 'linear-gradient(135deg, #1a1815 0%, #2d2820 50%, #1a1815 100%)',
      },
      boxShadow: {
        'tile': '0 2px 8px -2px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'tile-hover': '0 4px 16px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glow': '0 0 20px rgba(0, 71, 171, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}

