import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
        secondary: '#e67e22',
        accent: '#1abc9c',
        'background-light': '#f4f6f8',
        'background-dark': '#101c22',
        'text-light': '#333333',
        'text-dark': '#f4f6f8',
        'placeholder-light': '#a0aec0',
        'placeholder-dark': '#9db0b9'
      },
      fontFamily: {
        display: ['Space Grotesk', 'Noto Sans TC', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px'
      }
    }
  },
  plugins: []
};

export default config;
