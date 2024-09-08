import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'secondary-background': 'hsla(var(--color-bg-secondary), 1)',
        'primary-background': 'hsla(var(--color-bg-primary))',
        paper: 'rgba(var(--paper), 1)',
        card: 'rgba(var(--card), 1)',
        'card-foreground': 'rgba(var(--card-foreground),1)',
        primary: 'hsla(var(--color-primary-button),1)',
        secondary: 'hsla(var(--color-secondary))',
        'primary-foreground': 'hsla(var(--color-primary-background))',
        destructive: 'hsla(var(--color-destructive))',
        'table-header-bg': 'hsla(var(--color-table-header-bg))',
        gray: 'hsla(var(--color-gray))',
        'status-active': 'hsla(var(--color-status-active))',
        'disable-bg': 'hsla(var(--color-disable-bg))',
        'status-success': 'hsla(var(--color-success))',
        purple: 'hsla(var(--color-purple))',
        'auth-btn': 'hsla(var(--color-auth-btn))',
        'gray-500': 'rgb(107 114 128)',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
        manrope: ['var(--font-manrope)'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
