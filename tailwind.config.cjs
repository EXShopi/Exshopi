const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}'
  ],
  theme: {
    extend: {},
  },
  // Broad safelist to ensure utilities referenced via @apply are available
  safelist: [
    { pattern: /^(bg|text|border|from|to|via|shadow|rounded|px|py|p|m|gap|w|h|max-w|min-h|animate|translate|scale|ring|backdrop-blur|hover:|focus:|active:|disabled:).*/ },
  ],
  plugins: [typography],
};
