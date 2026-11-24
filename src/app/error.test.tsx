import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import ErrorPage from './error';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.mocked(console.error).mockRestore();
});

describe('ErrorPage', () => {
  it('announces a friendly error without leaking the raw message', () => {
    renderWithProviders(<ErrorPage error={new Error('ECONNRESET at socket')} reset={jest.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("We couldn't load the charts");
    expect(alert).not.toHaveTextContent('ECONNRESET');
  });

  it('logs the error for debugging', () => {
    const error = new Error('boom');
    renderWithProviders(<ErrorPage error={error} reset={jest.fn()} />);
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it('re-runs the server render and resets the boundary on retry', async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    renderWithProviders(<ErrorPage error={new Error('boom')} reset={reset} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
