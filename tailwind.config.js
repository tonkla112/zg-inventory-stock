module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.jsx',
  ],
  safelist: ['text-left', 'text-center', 'text-right'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E8F7F1',
          100: '#D2EFE3',
          200: '#A6DFC7',
          300: '#65C7A1',
          400: '#36B188',
          500: '#1D9E75',
          600: '#168862',
          700: '#0F6E56',
          800: '#0B5544',
          900: '#073D33',
        },
        ink: {
          DEFAULT: '#1A1A2E',
          soft: '#374151',
          mute: '#6B7280',
          faint: '#9CA3AF',
        },
        line: '#E5E7EB',
        line2: '#D1D5DB',
        page: '#F8FAFB',
        amber2: { bg: '#FAEEDA', fg: '#854F0B' },
        danger: { bg: '#FCEBEB', fg: '#A32D2D' },
        good: { bg: '#E1F5EE', fg: '#0F6E56' },
        info: { bg: '#E3EEFB', fg: '#1E4E8C' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(229,231,235,1)',
        pop: '0 8px 24px -8px rgba(15,23,42,.12), 0 0 0 1px rgba(229,231,235,1)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
};
