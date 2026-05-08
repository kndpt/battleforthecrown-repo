import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { NumericKeypad, type NumericKeypadProps } from './NumericKeypad';

function Harness(initialProps: Partial<NumericKeypadProps> = {}) {
  const [value, setValue] = useState(initialProps.value ?? 0);
  return (
    <NumericKeypad
      {...initialProps}
      value={value}
      onChange={(v) => {
        setValue(v);
        initialProps.onChange?.(v);
      }}
    />
  );
}

const clickDigit = (digit: number) => fireEvent.click(screen.getByRole('button', { name: String(digit) }));
const clickBackspace = () => fireEvent.click(screen.getByRole('button', { name: /effacer/i }));
const clickMax = () => fireEvent.click(screen.getByRole('button', { name: 'MAX' }));
const displayedValue = () => screen.getByTestId('keypad-value').textContent ?? '';
const fr = (n: number) => n.toLocaleString('fr-FR');

describe('NumericKeypad', () => {
  it('appends digits left-to-right', () => {
    render(<Harness max={1000} />);
    clickDigit(1);
    clickDigit(2);
    clickDigit(3);
    expect(displayedValue()).toBe('123');
  });

  it('replaces 0 instead of producing leading zeros', () => {
    render(<Harness max={1000} />);
    clickDigit(0);
    clickDigit(4);
    expect(displayedValue()).toBe('4');
  });

  it('clamps appended digit to max', () => {
    render(<Harness max={50} />);
    clickDigit(9);
    clickDigit(9);
    expect(displayedValue()).toBe('50');
  });

  it('restarts from a fresh digit when value is already at max', () => {
    render(<Harness value={50} max={50} />);
    clickDigit(7);
    expect(displayedValue()).toBe('7');
  });

  it('appends normally below max after the restart', () => {
    render(<Harness value={9} max={9999} />);
    clickDigit(5);
    expect(displayedValue()).toBe('95');
  });

  it('removes the rightmost digit on backspace', () => {
    render(<Harness max={1000} />);
    clickDigit(1);
    clickDigit(2);
    clickDigit(3);
    clickBackspace();
    expect(displayedValue()).toBe('12');
  });

  it('jumps to max with the MAX button', () => {
    render(<Harness max={4242} />);
    clickMax();
    expect(displayedValue()).toBe(fr(4242));
  });

  it('disables digits and MAX when max is 0', () => {
    render(<Harness max={0} />);
    expect(screen.getByRole('button', { name: '5' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'MAX' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /effacer/i })).toBeDisabled();
  });

  it('disables backspace at min', () => {
    render(<Harness max={100} />);
    expect(screen.getByRole('button', { name: /effacer/i })).toBeDisabled();
  });

  it('hides MAX button slot when no max is provided', () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'MAX' })).not.toBeInTheDocument();
  });

  it('forwards each clamped value to onChange', () => {
    const onChange = vi.fn();
    render(<Harness max={50} onChange={onChange} />);
    clickDigit(7);
    clickDigit(9);
    expect(onChange).toHaveBeenNthCalledWith(1, 7);
    expect(onChange).toHaveBeenNthCalledWith(2, 50);
  });

  it('replaces the initial value on first digit when clearOnFirstDigit is set', () => {
    render(<Harness value={42} max={9999} clearOnFirstDigit />);
    expect(displayedValue()).toBe('42');
    clickDigit(7);
    expect(displayedValue()).toBe('7');
    clickDigit(5);
    expect(displayedValue()).toBe('75');
  });

  it('does not replace when first interaction is backspace (clearOnFirstDigit)', () => {
    render(<Harness value={42} max={9999} clearOnFirstDigit />);
    clickBackspace();
    expect(displayedValue()).toBe('4');
    clickDigit(2);
    expect(displayedValue()).toBe('42');
  });

  it('keeps appending when clearOnFirstDigit is false', () => {
    render(<Harness value={42} max={9999} />);
    clickDigit(7);
    expect(displayedValue()).toBe('427');
  });
});
