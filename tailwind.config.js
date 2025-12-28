/// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-gray-900',
    'text-gray-100',
    'bg-gray-800',
    'border-gray-700',
    'text-gray-300',
    'text-gray-400',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
