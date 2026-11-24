/** Player glyphs. Decorative: every button using them carries its own aria-label. */

const base = { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;

export const PlayIcon = () => (
  <svg {...base} fill="currentColor">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);

export const PauseIcon = () => (
  <svg {...base} fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export const NextIcon = () => (
  <svg {...base} fill="currentColor">
    <path d="M5 6.5v11a1 1 0 0 0 1.53.85L14 13.6V17a1 1 0 0 0 2 0V7a1 1 0 0 0-2 0v3.4L6.53 5.65A1 1 0 0 0 5 6.5z" transform="translate(2 0)" />
  </svg>
);

export const PreviousIcon = () => (
  <svg {...base} fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
    <path d="M5 6.5v11a1 1 0 0 0 1.53.85L14 13.6V17a1 1 0 0 0 2 0V7a1 1 0 0 0-2 0v3.4L6.53 5.65A1 1 0 0 0 5 6.5z" transform="translate(2 0)" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Static "now playing" bars (no animation, so reduced-motion users aren't affected). */
export const NowPlayingIcon = () => (
  <svg {...base} fill="currentColor">
    <rect x="4" y="10" width="3" height="10" rx="1" />
    <rect x="10.5" y="5" width="3" height="15" rx="1" />
    <rect x="17" y="12" width="3" height="8" rx="1" />
  </svg>
);
