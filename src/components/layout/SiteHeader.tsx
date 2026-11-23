'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  height: ${({ theme }) => theme.layout.headerHeight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.space(4)};
`;

const Brand = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: none;
  letter-spacing: -0.01em;

  span {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export function SiteHeader() {
  return (
    <Header>
      <Inner>
        <Brand href="/" aria-label="WaveMusic home">
          Wave<span>Music</span>
        </Brand>
        <ThemeToggle />
      </Inner>
    </Header>
  );
}
