'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import styled from 'styled-components';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useFavorites } from '@/features/favorites/useFavorites';
import { HeartIcon, HomeIcon, LogoMark } from './icons';

const SkipLink = styled.a`
  position: fixed;
  top: ${({ theme }) => theme.space(3)};
  left: ${({ theme }) => theme.space(3)};
  z-index: ${({ theme }) => theme.zIndices.skipLink};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentContrast};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-decoration: none;
  transform: translateY(-200%);

  &:focus-visible {
    transform: none;
  }
`;

const Chrome = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  height: ${({ theme }) => theme.layout.headerHeight};
  padding: 0 ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.bg} 85%, transparent);
  backdrop-filter: saturate(1.4) blur(14px);

  ${({ theme }) => theme.media.lg} {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: ${({ theme }) => theme.zIndices.sidebar};
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    width: ${({ theme }) => theme.layout.sidebarWidth};
    height: auto;
    /* Leave room for the mini-player so the footer controls stay reachable. */
    padding: ${({ theme }) => `${theme.space(5)} ${theme.space(3)} calc(${theme.layout.playerHeight} + ${theme.space(4)})`};
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    border-bottom: 0;
    background: ${({ theme }) => theme.colors.bg};
    backdrop-filter: none;
  }
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 44px;
  padding: ${({ theme }) => `0 ${theme.space(3)}`};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.02em;
  text-decoration: none;

  svg {
    width: 30px;
    height: 30px;
  }
`;

const NavList = styled.ul`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  padding: 0;
  list-style: none;

  ${({ theme }) => theme.media.lg} {
    flex-direction: column;
    margin-top: ${({ theme }) => theme.space(6)};
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  min-width: 44px;
  min-height: 44px;
  padding: ${({ theme }) => `0 ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  svg {
    flex: none;
    width: 22px;
    height: 22px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceRaised};
    color: ${({ theme }) => theme.colors.text};
  }

  &[aria-current='page'] {
    background: ${({ theme }) => theme.colors.surfaceRaised};
    color: ${({ theme }) => theme.colors.text};
  }

  /* Phones: icon-only links in the header; the text stays for screen readers. */
  .nav-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  ${({ theme }) => theme.media.lg} {
    .nav-label {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      clip: auto;
    }
  }
`;

const Count = styled.span`
  margin-left: auto;
  padding: 0 ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surfaceHover};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  display: none;

  ${({ theme }) => theme.media.lg} {
    display: inline-block;
  }
`;

const Tools = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};

  ${({ theme }) => theme.media.lg} {
    flex: 1;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }
`;

const ThemeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  .theme-label {
    display: none;
  }

  ${({ theme }) => theme.media.lg} {
    margin-top: auto;
    padding: ${({ theme }) => `${theme.space(3)} ${theme.space(3)} 0`};
    border-top: 1px solid ${({ theme }) => theme.colors.border};

    .theme-label {
      display: inline;
    }
  }
`;

/**
 * Everything right of the sidebar. Positioned so full-bleed page decorations
 * (the album backdrop) span the whole content area, not just the centered,
 * max-width page container.
 */
const Content = styled.div`
  position: relative;
  min-width: 0;

  ${({ theme }) => theme.media.lg} {
    margin-left: ${({ theme }) => theme.layout.sidebarWidth};
  }
`;

type Section = 'home' | 'favorites' | null;

function NavItems({ active }: { active: Section }) {
  const { ready, ids } = useFavorites();
  return (
    <NavList>
      <li>
        <NavLink href="/" aria-current={active === 'home' ? 'page' : undefined}>
          <HomeIcon />
          <span className="nav-label">Top Albums</span>
        </NavLink>
      </li>
      <li>
        <NavLink href="/?favorites=1" aria-current={active === 'favorites' ? 'page' : undefined}>
          <HeartIcon />
          <span className="nav-label">Favorites</span>
          {ready && ids.length > 0 && <Count aria-label={`${ids.length} saved`}>{ids.length}</Count>}
        </NavLink>
      </li>
    </NavList>
  );
}

/** Reads the query string; isolated so it can sit inside a Suspense boundary. */
function ActiveNavItems() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active: Section =
    pathname === '/' ? (searchParams.get('favorites') ? 'favorites' : 'home') : null;
  return <NavItems active={active} />;
}

/**
 * Nav whose active item depends on the URL. useSearchParams needs a Suspense
 * boundary on statically rendered pages (e.g. the 404), so the fallback
 * renders the same links with only the path-based state.
 */
function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <Suspense fallback={<NavItems active={pathname === '/' ? 'home' : null} />}>
        <ActiveNavItems />
      </Suspense>
    </nav>
  );
}

/**
 * App chrome: one element that is a compact sticky top bar on phones and
 * tablets and a fixed left sidebar from 1024px up (CSS only, so nothing is
 * rendered twice). Pages render their own <main id="main"> inside.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink href="#main">Skip to content</SkipLink>

      <Chrome>
        <Brand href="/" aria-label="WaveMusic home">
          <LogoMark />
          <span className="brand-name">WaveMusic</span>
        </Brand>
        <Tools>
          <Nav />
          <ThemeRow>
            <span className="theme-label" aria-hidden="true">
              Theme
            </span>
            <ThemeToggle />
          </ThemeRow>
        </Tools>
      </Chrome>

      <Content>{children}</Content>
    </>
  );
}
