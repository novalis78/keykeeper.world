/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ebf9ff',
          100: '#d6f4ff',
          200: '#adeaff',
          300: '#84dfff',
          400: '#5ad1ff',
          500: '#31c1ff',
          600: '#09a0e1',
          700: '#0082c0',
          800: '#00679a',
          900: '#00517a',
          950: '#0a1020',
        },
        sidebar: '#0f1729',
        dashboard: '#0a1020',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-roboto-mono)'],
      },
    },
  },
  plugins: [],
};
