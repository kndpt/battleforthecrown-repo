'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const triggerVariants = cva(
  [
    'font-game font-semibold',
    'relative flex w-full items-center justify-between gap-2',
    'border-2 rounded-lg',
    'cursor-pointer outline-none text-left',
    'transition-all duration-150',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-white to-gray-50',
          'border-[#d4c094]',
          'text-gray-800',
          'hover:border-[#c4b084]',
          'focus-visible:border-[#b4a074] focus-visible:ring-2 focus-visible:ring-[#d4c094]/30',
        ],
        parchment: [
          'bg-gradient-to-b from-[#f4e4c1] to-[#e8d4a8]',
          'border-[#d4c094]',
          'text-gray-800',
          'hover:border-[#c4b084]',
          'focus-visible:border-[#b4a074] focus-visible:ring-2 focus-visible:ring-[#d4c094]/30',
        ],
        success: [
          'bg-gradient-to-b from-game-green-light/20 to-game-green-dark/20',
          'border-game-green-border',
          'text-gray-800',
          'hover:border-game-green-dark',
          'focus-visible:border-game-green-dark focus-visible:ring-2 focus-visible:ring-game-green-light/30',
        ],
        info: [
          'bg-gradient-to-b from-game-blue-light/20 to-game-blue-dark/20',
          'border-game-blue-border',
          'text-gray-800',
          'hover:border-game-blue-dark',
          'focus-visible:border-game-blue-dark focus-visible:ring-2 focus-visible:ring-game-blue-light/30',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-2.5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const iconVariants = cva(['shrink-0 transition-transform duration-200'], {
  variants: {
    variant: {
      default: 'text-gray-600',
      parchment: 'text-gray-700',
      success: 'text-game-green-dark',
      info: 'text-game-blue-dark',
    },
  },
});

const optionVariants = cva(
  [
    'flex items-center justify-between gap-2',
    'cursor-pointer select-none',
    'px-3 py-2',
    'font-game text-sm font-semibold text-gray-800',
    'transition-colors duration-100',
  ],
  {
    variants: {
      active: {
        true: 'bg-[#f4e4c1]',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends VariantProps<typeof triggerVariants> {
  options: SelectOption[];
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  /** When set, a hidden input mirrors the value for native form submission. */
  name?: string;
  className?: string;
  'aria-label'?: string;
}

const POPUP_GAP = 4;
const POPUP_MAX_HEIGHT = 240;
const VIEWPORT_PADDING = 8;

interface PopupPosition {
  /** Distance from viewport top, when opening downward. */
  top?: number;
  /** Distance from viewport bottom, when opening upward (anchors the popup's bottom edge to the trigger). */
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

function computePosition(rect: DOMRect): PopupPosition {
  const spaceBelow = window.innerHeight - rect.bottom - POPUP_GAP - VIEWPORT_PADDING;
  const spaceAbove = rect.top - POPUP_GAP - VIEWPORT_PADDING;
  const openUp = spaceBelow < Math.min(POPUP_MAX_HEIGHT, 160) && spaceAbove > spaceBelow;
  const maxHeight = Math.max(
    96,
    Math.min(POPUP_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow),
  );

  // Upward: anchor via `bottom` so the popup hugs the trigger and grows up with its
  // real content height (using `top - maxHeight` would float it far above for short lists).
  return openUp
    ? {
        bottom: window.innerHeight - rect.top + POPUP_GAP,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement: 'top',
      }
    : {
        top: rect.bottom + POPUP_GAP,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement: 'bottom',
      };
}

export function Select({
  className,
  variant,
  size = 'md',
  options,
  placeholder,
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled = false,
  required = false,
  id,
  name,
  'aria-label': ariaLabel,
}: SelectProps) {
  const reactId = useId();
  const listboxId = `${id ?? reactId}-listbox`;
  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const value = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<PopupPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition(computePosition(rect));
  }, []);

  const closePopup = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openPopup = useCallback(() => {
    if (disabled || options.length === 0) return;
    updatePosition();
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, options.length, selectedIndex, updatePosition]);

  const commit = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
      closePopup();
      triggerRef.current?.focus();
    },
    [closePopup, isControlled, onValueChange],
  );

  // Reposition on layout, scroll, and resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [open, updatePosition]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      closePopup();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, closePopup]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        const start = current < 0 ? selectedIndex : current;
        const next = start + delta;
        if (next < 0) return 0;
        if (next > options.length - 1) return options.length - 1;
        return next;
      });
    },
    [options.length, selectedIndex],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openPopup();
        else moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openPopup();
        else moveActive(-1);
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) openPopup();
        else if (activeIndex >= 0) commit(options[activeIndex].value);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closePopup();
        }
        break;
      case 'Tab':
        if (open) closePopup();
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative w-full">
      <button
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={triggerVariants({ variant, size, className })}
        disabled={disabled || options.length === 0}
        id={id}
        onClick={() => (open ? closePopup() : openPopup())}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span
          className={cn(
            'truncate',
            !selectedOption && 'text-gray-500 font-normal',
          )}
        >
          {selectedOption?.label ?? placeholder ?? 'Sélectionner'}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(iconVariants({ variant }), open && 'rotate-180')}
          size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      </button>

      {name ? (
        <input
          name={name}
          required={required}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          value={value}
          onChange={() => undefined}
        />
      ) : null}

      {open && position
        ? createPortal(
            <ul
              className="fixed z-[9999] overflow-y-auto rounded-lg border-2 border-[#d4c094] bg-[linear-gradient(to_bottom,#fef9f0,#f4e4c1)] py-1 shadow-[0_8px_24px_rgba(0,0,0,.35)]"
              id={listboxId}
              ref={listRef}
              role="listbox"
              style={{
                ...(position.placement === 'top'
                  ? { bottom: position.bottom }
                  : { top: position.top }),
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    aria-selected={isSelected}
                    className={optionVariants({ active: index === activeIndex })}
                    key={option.value}
                    onClick={() => commit(option.value)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? (
                      <Check
                        aria-hidden
                        className="shrink-0 text-[#8b6f47]"
                        size={16}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

Select.displayName = 'Select';
