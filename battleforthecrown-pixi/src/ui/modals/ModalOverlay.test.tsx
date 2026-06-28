import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalOverlay } from './ModalOverlay';

afterEach(() => {
  document.body.style.overflow = '';
});

function renderOverlay(props: Partial<React.ComponentProps<typeof ModalOverlay>> = {}) {
  const onClose = props.onClose ?? vi.fn();
  const utils = render(
    <ModalOverlay isOpen ariaLabel="Test" onClose={onClose} {...props}>
      <div data-testid="content">
        <button type="button">Action</button>
      </div>
    </ModalOverlay>,
  );
  return { ...utils, onClose };
}

describe('ModalOverlay', () => {
  it('renders nothing while closed', () => {
    render(
      <ModalOverlay isOpen={false} onClose={() => undefined}>
        <div data-testid="content">x</div>
      </ModalOverlay>,
    );
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('renders an accessible dialog with its content when open', () => {
    renderOverlay();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test');
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('becomes visible (pop animation reaches its open state) after mount', () => {
    renderOverlay();
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('scale-100');
    expect(dialog.className).toContain('opacity-100');
  });

  it('locks body scroll while open', () => {
    renderOverlay();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes on Escape by default', () => {
    const { onClose } = renderOverlay();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape when disabled', () => {
    const { onClose } = renderOverlay({ closeOnEscape: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on overlay click but not on content click', () => {
    const { onClose } = renderOverlay();
    const dialog = screen.getByRole('dialog');

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    // Le calque de centrage (parent du dialog) capte les clics extérieurs.
    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on overlay click when disabled', () => {
    const { onClose } = renderOverlay({ closeOnOverlayClick: false });
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the dialog mounted until the exit transition ends, then unmounts', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ModalOverlay isOpen ariaLabel="Test" onClose={onClose}>
        <div data-testid="content">x</div>
      </ModalOverlay>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(
      <ModalOverlay isOpen={false} ariaLabel="Test" onClose={onClose}>
        <div data-testid="content">x</div>
      </ModalOverlay>,
    );
    // Toujours monté pendant l'animation de sortie.
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('opacity-0');

    fireEvent.transitionEnd(dialog, { propertyName: 'opacity' });
    expect(screen.queryByRole('dialog')).toBeNull();
    // Scroll restauré.
    expect(document.body.style.overflow).toBe('');
  });
});
