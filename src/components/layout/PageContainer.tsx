'use client';

import styled from 'styled-components';

/**
 * Page body and skip-link target (#main). Focusable (tabIndex -1) so the skip
 * link moves keyboard focus here, not just the scroll position. A client
 * module so server pages can render it.
 */
export const PageContainer = styled.main.attrs({ id: 'main', tabIndex: -1 })`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(4)} ${theme.space(10)}`};

  &:focus {
    outline: none;
  }

  ${({ theme }) => theme.media.md} {
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(8)} ${theme.space(12)}`};
  }

  ${({ theme }) => theme.media.xl} {
    padding-left: ${({ theme }) => theme.space(12)};
    padding-right: ${({ theme }) => theme.space(12)};
  }
`;

/** Page title block: an h1 and an optional muted subtitle paragraph. */
export const PageHeader = styled.header`
  margin-bottom: ${({ theme }) => theme.space(6)};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin-bottom: ${({ theme }) => theme.space(1)};

    ${({ theme }) => theme.media.md} {
      font-size: ${({ theme }) => theme.fontSizes.display};
    }
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;
