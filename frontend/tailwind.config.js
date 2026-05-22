/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        vt:    ['"VT323"', 'monospace'],
        silk:  ['"Silkscreen"', 'monospace'],
      },
      colors: {
        navy:  '#0a0e1a',
        gold:  '#ffd700',
        green: '#00ff88',
        red:   '#ff4444',
        blue:  '#4488ff',
        purple:'#bb44ff',
        dim:   '#1a2035',
        border:'#2a3555',
      },
      boxShadow: {
        pixel: '4px 4px 0px #000',
        glow:  '0 0 12px #ffd700, 0 0 24px #ffd70044',
        green: '0 0 12px #00ff88, 0 0 24px #00ff8844',
        red:   '0 0 12px #ff4444, 0 0 24px #ff444444',
      },
      animation: {
        'shake':   'shake 0.4s ease-in-out',
        'flash':   'flash 0.3s ease-in-out',
        'float':   'float 3s ease-in-out infinite',
        'blink':   'blink 1s step-end infinite',
      },
      keyframes: {
        shake:  { '0%,100%': {transform:'translateX(0)'}, '25%': {transform:'translateX(-8px)'}, '75%': {transform:'translateX(8px)'} },
        flash:  { '0%,100%': {opacity:'1'}, '50%': {opacity:'0.2'} },
        float:  { '0%,100%': {transform:'translateY(0)'}, '50%': {transform:'translateY(-8px)'} },
        blink:  { '0%,100%': {opacity:'1'}, '50%': {opacity:'0'} },
      },
    },
  },
  plugins: [],
}
