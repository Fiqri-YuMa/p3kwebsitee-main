/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  future: {
    useOklch: false, // ⛔ pastikan warna tidak pakai oklch
  },
  
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      colors: {
        sky: {
          50: '#ebf8ff',
          100: '#d5f0ff',
          200: '#b2deff',
          300: '#82cbff',
          400: '#50b5ff',
          500: '#39a2ff',
          600: '#2c8ae6',
          700: '#226ebf',
          800: '#1a5598',
          900: '#153f70',
        },
        primary: '#49b8ff',
      },
      backgroundImage: {
        'sky-2026': 'linear-gradient(135deg, #cfeeff 0%, #a0d6ff 60%, #7bbfff 100%)',
      },
      future: {
        respectDefaultRingColorOpacity: false,
      },
      corePlugins: {
        preflight:false,
      }
    },
    colors: {
      pink: {
        600: '#e6007e', // warna khas twentysix
      }
    }
    
  },
  plugins: [],
}
