/** @type {import('tailwindcss').Config} */
export default {
  // Quét tất cả JSX/JS trong src/ để tree-shake class không dùng
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens của LACEBO — dùng thống nhất với CSS vars
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
        },
        secondary: '#db2777',
        surface: {
          DEFAULT: '#1a1a24',
          2: '#23232f',
        },
        border: '#2e2e3e',
        muted: '#8b8aa0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
      },
    },
  },
  plugins: [],
};
