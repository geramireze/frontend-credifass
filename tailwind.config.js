/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          hover:   '#4F46E5',
          light:   '#EEF2FF',
          fg:      '#FFFFFF',
        },
        app: {
          bg:         '#F8FAFC',
          card:       '#FFFFFF',
          border:     '#E2E8F0',
          muted:      '#F1F5F9',
          'muted-fg': '#64748B',
          fg:         '#0F172A',
          'fg-2':     '#334155',
        },
        sidebar: {
          DEFAULT: '#1E293B',
          text:    '#CBD5E1',
          active:  '#FFFFFF',
          accent:  '#6366F1',
        },
        status: {
          'al-dia':         '#10B981',
          'al-dia-light':   '#D1FAE5',
          'al-dia-fg':      '#065F46',
          mora:             '#DC2626',
          'mora-light':     '#FEE2E2',
          'mora-fg':        '#991B1B',
          pendiente:        '#F59E0B',
          'pendiente-light':'#FEF3C7',
          'pendiente-fg':   '#92400E',
          pagado:           '#6366F1',
          'pagado-light':   '#EEF2FF',
          'pagado-fg':      '#3730A3',
          cancelado:        '#64748B',
          'cancelado-light':'#F1F5F9',
          info:             '#3B82F6',
          'info-light':     '#DBEAFE',
          'info-fg':        '#1E40AF',
          success:          '#10B981',
          'success-light':  '#D1FAE5',
          'success-fg':     '#065F46',
          warning:          '#F59E0B',
          'warning-light':  '#FEF3C7',
          'warning-fg':     '#92400E',
          error:            '#EF4444',
          'error-light':    '#FEE2E2',
          'error-fg':       '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm:   '4px',
        DEFAULT: '8px',
        lg:   '12px',
        xl:   '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        sm:   '0 1px 2px rgba(0,0,0,0.05)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
