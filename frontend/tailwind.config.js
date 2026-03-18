/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary':    'var(--bg-primary)',
        'bg-secondary':  'var(--bg-secondary)',
        'bg-tertiary':   'var(--bg-tertiary)',
        'border-c':      'var(--border-color)',
        'tx-primary':    'var(--text-primary)',
        'tx-secondary':  'var(--text-secondary)',
        'accent':        'var(--accent)',
        'accent-hover':  'var(--accent-hover)',
        'success':       'var(--success)',
        'warning':       'var(--warning)',
        'danger':        'var(--danger)',
      },
      borderRadius: {
        'xs': 'var(--radius-xs)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
      },
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      fontSize: {
        'xs': 'var(--font-xs)',
        'sm': 'var(--font-sm)',
        'base': 'var(--font-base)',
        'lg': 'var(--font-lg)',
        'xl': 'var(--font-xl)',
      },
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'base': 'var(--duration-base)',
        'slow': 'var(--duration-slow)',
      },
      zIndex: {
        'header':   'var(--z-header)',
        'backdrop': 'var(--z-backdrop)',
        'modal':    'var(--z-modal)',
        'toast':    'var(--z-toast)',
        'tooltip':  'var(--z-tooltip)',
      },
    },
  },
  corePlugins: {
    // Disable Tailwind's CSS reset so it doesn't conflict with our existing styles
    preflight: false,
  },
  plugins: [],
};
