/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FBF4',
          100: '#D5F2E0',
          200: '#B0E5C5',
          300: '#79D49C',
          400: '#38A862',
          500: '#044A1A',
          600: '#033D16',
          700: '#023012',
          800: '#01240D',
          900: '#011809',
        },
        secondary: {
          50: '#F0FDF9',
          100: '#CCFBEF',
          500: '#0D7C5F',
          700: '#085A45',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F7F7F7',
          100: '#EBEBEB',
          200: '#DDDDDD',
          300: '#B0B0B0',
          400: '#717171',
          500: '#484848',
          600: '#222222',
          700: '#000000',
        },
      },
    },
  },
  plugins: [],
};
