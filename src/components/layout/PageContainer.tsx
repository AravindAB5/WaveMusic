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

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
    margin-bottom: ${({ theme }) => theme.space(2)};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;
