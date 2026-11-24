'use client';

import styled from 'styled-components';

/** Centered, padded page body. A client module so server pages can render it. */
export const PageContainer = styled.main`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.space(6)} ${theme.space(4)}`};

  ${({ theme }) => theme.media.md} {
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(6)}`};
  }
`;

/** Page title block: an h1 and an optional muted subtitle paragraph. */
export const PageHeader = styled.header`
  margin-bottom: ${({ theme }) => theme.space(6)};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: ${({ theme }) => theme.space(1)};

    ${({ theme }) => theme.media.md} {
      font-size: ${({ theme }) => theme.fontSizes.xxl};
    }
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;
