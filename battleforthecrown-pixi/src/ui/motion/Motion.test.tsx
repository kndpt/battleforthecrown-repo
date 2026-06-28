import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Motion } from './Motion';
import { MOTION_PRESETS } from './motionPresets';

describe('Motion', () => {
  it('applies the preset animation when active', () => {
    render(
      <Motion active preset="wizz">
        <span>seal</span>
      </Motion>,
    );
    const wrapper = screen.getByText('seal').parentElement;
    expect(wrapper).toHaveClass('bftc-motion');
    expect(wrapper?.style.animation).toContain('bftc-wizz');
  });

  it('omits the animation when inactive', () => {
    render(
      <Motion active={false} preset="wizz">
        <span>seal</span>
      </Motion>,
    );
    expect(screen.getByText('seal').parentElement?.style.animation).toBe('');
  });

  it('selects the requested preset', () => {
    render(
      <Motion preset="pulse">
        <span>seal</span>
      </Motion>,
    );
    expect(screen.getByText('seal').parentElement?.style.animation).toBe(
      MOTION_PRESETS.pulse,
    );
  });
});
