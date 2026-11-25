import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWithProviders } from '@/test/render';
import { Select, type SelectOption } from './Select';

type Fruit = 'apple' | 'banana' | 'blueberry' | 'cherry';
const OPTIONS: readonly SelectOption<Fruit>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
];

const onChangeSpy = jest.fn();

function Harness({ initial = 'apple' as Fruit }) {
  const [value, setValue] = useState<Fruit>(initial);
  return (
    <>
      <Select
        label="Fruit"
        value={value}
        options={OPTIONS}
        onChange={(next) => {
          onChangeSpy(next);
          setValue(next);
        }}
      />
      <button type="button">After</button>
    </>
  );
}

const setup = (initial?: Fruit) => {
  const user = userEvent.setup();
  renderWithProviders(<Harness initial={initial} />);
  const combobox = screen.getByRole('combobox', { name: 'Fruit' });
  const activeOption = () => {
    const id = combobox.getAttribute('aria-activedescendant');
    return id ? document.getElementById(id) : null;
  };
  return { user, combobox, activeOption };
};

afterEach(() => onChangeSpy.mockClear());

describe('Select', () => {
  it('is a labelled, collapsed combobox showing the current value', () => {
    const { combobox } = setup('banana');
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveTextContent('Banana');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on click with the selected option marked and highlighted', async () => {
    const { user, combobox, activeOption } = setup('blueberry');
    await user.click(combobox);

    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: 'Fruit' });
    expect(combobox).toHaveAttribute('aria-controls', listbox.id);
    expect(within(listbox).getByRole('option', { name: 'Blueberry' })).toHaveAttribute('aria-selected', 'true');
    expect(activeOption()).toHaveTextContent('Blueberry');
  });

  it('chooses an option by click and closes', async () => {
    const { user, combobox } = setup();
    await user.click(combobox);
    await user.click(screen.getByRole('option', { name: 'Cherry' }));

    expect(onChangeSpy).toHaveBeenCalledWith('cherry');
    expect(combobox).toHaveTextContent('Cherry');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('is fully keyboard operable: arrows, Home/End, Enter', async () => {
    const { user, combobox, activeOption } = setup();
    combobox.focus();

    await user.keyboard('{ArrowDown}'); // opens on the current option
    expect(activeOption()).toHaveTextContent('Apple');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeOption()).toHaveTextContent('Blueberry');
    await user.keyboard('{End}');
    expect(activeOption()).toHaveTextContent('Cherry');
    await user.keyboard('{ArrowDown}'); // clamps at the end
    expect(activeOption()).toHaveTextContent('Cherry');
    await user.keyboard('{Home}{ArrowUp}'); // clamps at the start
    expect(activeOption()).toHaveTextContent('Apple');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChangeSpy).toHaveBeenCalledWith('banana');
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('Escape closes without changing the value', async () => {
    const { user, combobox } = setup();
    combobox.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Escape}');

    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(combobox).toHaveTextContent('Apple');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('Tab commits the highlighted option and moves focus on', async () => {
    const { user, combobox } = setup();
    combobox.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.tab();

    expect(onChangeSpy).toHaveBeenCalledWith('banana');
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('jumps to options by typed letter, cycling through matches', async () => {
    const { user, combobox, activeOption } = setup();
    combobox.focus();

    await user.keyboard('b');
    expect(activeOption()).toHaveTextContent('Banana');
    await user.keyboard('b');
    expect(activeOption()).toHaveTextContent('Blueberry');
    await user.keyboard('b'); // wraps around
    expect(activeOption()).toHaveTextContent('Banana');
  });

  it('does not report a change when re-choosing the current value', async () => {
    const { user, combobox } = setup('apple');
    await user.click(combobox);
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('closes when clicking outside', async () => {
    const { user, combobox } = setup();
    await user.click(combobox);
    await user.click(document.body);
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });
});
