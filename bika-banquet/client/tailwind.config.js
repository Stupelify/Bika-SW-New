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
          50: '#eefcf8',
          100: '#d8f7ee',
          200: '#b3eedf',
          300: '#7fdfc9',
          400: '#41c9ad',
          500: '#18af94',
          600: '#0e8b76',
          700: '#0d6e5f',
          800: '#0f584e',
          900: '#0f4942',
        },
        accent: {
          50: '#fff4ec',
          100: '#ffe7d3',
          200: '#ffccab',
          300: '#ffad7d',
          400: '#ff8a4d',
          500: '#f56b23',
          600: '#d94f10',
          700: '#b23e11',
          800: '#8f3415',
          900: '#742d15',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
