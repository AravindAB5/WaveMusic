'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

const popIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
`;

const Root = styled.div`
  position: relative;
  flex: none;
`;

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 44px;
  max-width: 100%;
  padding: ${({ theme }) => `0 ${theme.space(3)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover,
  &[aria-expanded='true'] {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &[aria-expanded='true'] {
    border-color: ${({ theme }) => theme.colors.focus};
  }

  .value {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  svg {
    flex: none;
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  .chevron {
    width: 16px;
    height: 16px;
    margin-left: ${({ theme }) => theme.space(1)};
    transition: transform ${({ theme }) => theme.transitions.fast};
  }

  &[aria-expanded='true'] .chevron {
    transform: rotate(180deg);
  }
`;

const Listbox = styled.ul`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: ${({ theme }) => theme.zIndices.overlay};
  min-width: max(100%, 13rem);
  margin: 0;
  padding: ${({ theme }) => theme.space(1)};
  list-style: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${popIn} 120ms ease-out;
`;

const Option = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 40px;
  padding: ${({ theme }) => `0 ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  user-select: none;

  &[data-active='true'] {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &[aria-selected='true'] {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Chevron = () => (
  <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
);

interface SelectProps<T extends string> {
  /** Accessible label. Visually hidden unless `showLabel`. */
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  /** Decorative icon shown before the value. */
  icon?: ReactNode;
}

/**
 * A styled single-select built on the WAI-ARIA "select-only combobox"
 * pattern (a button with role="combobox" + a listbox popup), because native
 * <select> dropdown lists can't be styled consistently across browsers.
 *
 * Keyboard: ↑/↓/Home/End move (and open), Enter/Space choose, Escape cancels,
 * Tab commits the highlighted option, typing a letter jumps to the next
 * option starting with it. Focus stays on the trigger; the highlighted option
 * is conveyed with aria-activedescendant.
 */
export function Select<T extends string>({ label, value, options, onChange, icon }: SelectProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close when clicking anywhere outside the control.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    setOpen(false);
    if (option && option.value !== value) onChange(option.value);
  };

  const clamp = (index: number) => Math.min(options.length - 1, Math.max(0, index));

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event;

    // Type-ahead: jump to the next option starting with the typed character.
    if (key.length === 1 && /\S/.test(key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const from = open ? activeIndex : selectedIndex;
      const lower = key.toLowerCase();
      for (let step = 1; step <= options.length; step++) {
        const index = (from + step) % options.length;
        if (options[index]?.label.toLowerCase().startsWith(lower)) {
          openAt(index);
          break;
        }
      }
      return;
    }

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(key)) {
        event.preventDefault();
        openAt(key === 'Home' ? 0 : key === 'End' ? options.length - 1 : selectedIndex);
      }
      return;
    }

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => clamp(index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => clamp(index - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        // Commit the highlighted option and let focus move on.
        choose(activeIndex);
        break;
    }
  };

  const selected = options[selectedIndex];

  return (
    <Root ref={rootRef}>
      <span id={labelId} hidden>
        {label}
      </span>
      <Trigger
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        title={label}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      >
        {icon}
        <span className="value">{selected?.label}</span>
        <Chevron />
      </Trigger>
      {open && (
        <Listbox id={listboxId} role="listbox" aria-labelledby={labelId} tabIndex={-1}>
          {options.map((option, index) => (
            <Option
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex}
              onPointerEnter={() => setActiveIndex(index)}
              // Keep focus on the trigger (so blur doesn't close the list first).
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {option.label}
              {option.value === value && <Check />}
            </Option>
          ))}
        </Listbox>
      )}
    </Root>
  );
}
