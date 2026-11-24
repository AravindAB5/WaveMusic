'use client';

import type { AriaRole, ReactNode } from 'react';
import styled from 'styled-components';

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  max-width: 32rem;
  margin: ${({ theme }) => `${theme.space(12)} auto`};
  padding: ${({ theme }) => theme.space(8)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  text-align: center;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

interface StatusPanelProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** `alert` for errors so screen readers announce them; omit for empty states. */
  role?: AriaRole;
}

/** Centered message for empty and error states. */
export function StatusPanel({ title, children, action, role }: StatusPanelProps) {
  return (
    <Panel role={role} aria-label={role ? undefined : title}>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </Panel>
  );
}
