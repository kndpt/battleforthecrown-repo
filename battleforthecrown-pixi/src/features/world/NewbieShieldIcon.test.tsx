import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewbieShieldIcon } from './NewbieShieldIcon';

describe('NewbieShieldIcon', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the shield image when the shield is still active', () => {
    vi.setSystemTime(new Date('2026-06-20T00:00:00.000Z'));
    render(<NewbieShieldIcon endsAt="2026-06-20T12:30:00.000Z" />);
    expect(
      screen.getByRole('img', { name: /Protection débutant — 12h 30m restantes/ }),
    ).toBeInTheDocument();
  });

  it('renders nothing once the shield has expired', () => {
    vi.setSystemTime(new Date('2026-06-21T00:00:00.000Z'));
    const { container } = render(
      <NewbieShieldIcon endsAt="2026-06-20T12:00:00.000Z" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when endsAt is not a valid date', () => {
    const { container } = render(<NewbieShieldIcon endsAt="not-a-date" />);
    expect(container).toBeEmptyDOMElement();
  });
});
