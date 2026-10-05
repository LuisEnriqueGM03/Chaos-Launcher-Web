import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lava: {
          bg: '#0a0606',
          sidebar: '#110808',
          card: '#1a0d0d',
          border: '#331010',
          hover: '#261111',
          red: '#ff1e1e',
          crimson: '#dc143c',
          fire: '#ff5500',
          orange: '#ff7700',
          amber: '#ffaa00',
        },
        chaos: {
          dark: '#0a0606',
          card: '#140a0a',
          border: '#2b1010',
          red: '#ff2222',
          orange: '#ff6600',
          green: '#22c55e',
        },
      },
      fontFamily: {
        minecraft: ['var(--font-minecraft)', 'Silkscreen', 'VT323', 'monospace'],
      },
      boxShadow: {
        'minecraft-btn': 'inset -2px -4px 0px rgba(0,0,0,0.5), inset 2px 2px 0px rgba(255,255,255,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
