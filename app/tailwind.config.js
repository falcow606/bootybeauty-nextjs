// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#fff6f6',100:'#ffe9ea',200:'#ffd1d6',300:'#ffb0b8',
          400:'#f191a0',500:'#e37289',600:'#d35677',700:'#b63e60',
          800:'#95334f',900:'#7b2b43',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        serif: ['var(--font-heading)'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.06)',
      },
      borderRadius: {
        xl: '0.8rem',
        '2xl': '1rem',
        '3xl': '1.4rem',
      },
    },
  },
  plugins: [],
};
