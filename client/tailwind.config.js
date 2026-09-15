/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Corner radius tuned down to a restrained 2–6px scale (real VN e-commerce
      // style). rounded-full is intentionally left at 9999px for avatars/icons.
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '4px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
      },
      colors: {
        kimdong: {
          red: '#D91C24',
          darkred: '#C0181F',
          deepred: '#990F15',
          lightred: '#FFF5F5',
          gray: '#F9FAFB',
          border: '#E5E7EB',
          text: '#1F2937',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 12px 24px -8px rgba(217, 28, 36, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)',
        'mega': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }
    },
  },
  plugins: [],
}
