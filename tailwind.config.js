/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      height: {
        header: '60px'
      },
      maxWidth: {
        1050: '1050px',
        1200: '1200px'
      },
      colors: {
        transparent: '#00000000',
        bg: {
          DEFAULT: '#FFFFFF',
          dark: '#141414'
        },
        primary: {
          DEFAULT: '#303133',
          dark: '#E5EAF3'
        },
        regular: {
          DEFAULT: '#606266',
          dark: '#CFD3DC'
        },
        secondary: {
          DEFAULT: '#909399',
          dark: '#A3A6AD'
        },
        darker: {
          fill: {
            DEFAULT: '#E6E8EB',
            dark: '#424243'
          },
          border: {
            DEFAULT: '#CDD0D6',
            dark: '#636466'
          }
        },
        dark: {
          fill: {
            DEFAULT: '#EBEDF0',
            dark: '#39393A'
          },
          border: {
            DEFAULT: '#D4D7DE',
            dark: '#58585B'
          }
        },
        base: {
          fill: {
            DEFAULT: '#F0F2F5',
            dark: '#303030'
          },
          border: {
            DEFAULT: '#DCDFE6',
            dark: '#4C4D4F'
          }
        },
        light: {
          fill: {
            DEFAULT: '#F5F7FA',
            dark: '#262727'
          },
          border: {
            DEFAULT: '#E4E7ED',
            dark: '#414243'
          }
        },
        lighter: {
          fill: {
            DEFAULT: '#FAFAFA',
            dark: '#1D1D1D'
          },
          border: {
            DEFAULT: '#EBEEF5',
            dark: '#363637'
          }
        },
        moonlight: {
          99: '#E3F3FF',
          100: '#E8F7FF',
          200: '#C2E9FF',
          300: '#9CD7FF',
          400: '#75C3FF',
          500: '#4FADFF',
          600: '#2994FF',
          700: '#1970D2',
          800: '#0D4FA6',
          900: '#053379',
          950: '#001C4D',
          999: '#192833'
        },
        sakura: {
          100: '#FFEFF6',
          200: '#FFD7EB',
          300: '#FFBEE0',
          400: '#FFA5D4',
          500: '#FF87C8',
          600: '#F472B6',
          700: '#D05595',
          800: '#AD3876',
          900: '#8A1857',
          950: '#640039'
        },
        danger: '#F56C6C',
        success: '#67C23A',
        warning: '#E6A23C',
        info: '#909399'
      },
      zIndex: {
        header: 1000
      },
      fontFamily: {
        title: ['Times', '"Times New Roman"', 'STKaiti', 'KaiTi', 'serif'],
        blog: ['"Note-Script-Medium"', 'serif']
      },
      screens: {
        smheader: '1050px',
        tb: '767px',
        lt: '1200px',
        dt: '1500px',
        lg: '1800px'
      }
    }
  },
  plugins: []
}
