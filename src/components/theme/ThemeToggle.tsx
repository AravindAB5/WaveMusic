'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { applyScheme, resolveScheme } from '@/styles/colorScheme';
import type { ColorScheme } from '@/styles/palettes';

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceRaised};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/**
 * Flips between light and dark. The real scheme lives on `<html data-theme>`
 * (set pre-paint by the inline init script), so this only reads it after mount:
 * the server can't know it, and guessing would cause a hydration mismatch.
 */
export function ThemeToggle() {
  const [scheme, setScheme] = useState<ColorScheme | null>(null);

  useEffect(() => {
    setScheme(resolveScheme());
  }, []);

  const current = scheme ?? 'light';
  const next: ColorScheme = current === 'dark' ? 'light' : 'dark';

  const handleClick = () => {
    applyScheme(next);
    setScheme(next);
  };

  return (
    <Button type="button" onClick={handleClick} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {current === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
