/** Navigation and UI glyphs. Decorative: links/buttons carry their own accessible names. */

const base = { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;

export const HomeIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

export const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const ExternalIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export const ChevronLeftIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

/** WaveMusic mark: an original equalizer-wave glyph in a gradient tile. */
export const LogoMark = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="wm-logo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9b87ff" />
        <stop offset="1" stopColor="#5b3bd6" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="9" fill="url(#wm-logo)" />
    <path
      d="M7 17.5c1.6 0 1.6-5 3.2-5s1.6 9 3.2 9 1.6-13 3.2-13 1.6 11 3.2 11 1.6-6 3.2-6 1.4 2.6 2 3"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
