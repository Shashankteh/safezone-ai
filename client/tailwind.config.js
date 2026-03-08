/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#050d14',
          800: '#0a1628',
          700: '#0f1f3a',
          600: '#1a2f50',
        },
        neon: {
          green: '#00ff88',
          blue: '#00c8ff',
          red: '#ff3366',
          amber: '#ffaa00',
        },
        danger: '#ff3366',
        safe: '#00ff88',
        warning: '#ffaa00',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Share Tech Mono', 'monospace'],
        sans: ['Rajdhani', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
      },
      animation: {
        'pulse-sos': 'pulse-sos 1s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scan': 'scan 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-sos': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(255,51,102,0.5)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 40px rgba(255,51,102,0.9)' },
        },
        'scan': {
          '0%': { top: '0', opacity: '0' },
          '5%': { opacity: '1' },
          '95%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        'glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.4))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.8))' },
        }
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0,255,136,0.4)',
        'neon-red': '0 0 20px rgba(255,51,102,0.4)',
        'neon-blue': '0 0 20px rgba(0,200,255,0.4)',
      }
    },
  },
  plugins: [],
};
