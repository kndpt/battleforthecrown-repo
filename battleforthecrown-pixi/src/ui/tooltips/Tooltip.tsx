"use client";

import {
  ReactNode,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";

const tooltipVariants = cva(
  [
    "fixed z-[9999]",
    "px-3 py-2",
    "font-game text-sm text-white",
    "rounded-lg",
    "pointer-events-none",
    "max-w-xs",
    "transition-opacity duration-200",
    "shadow-lg",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#8b6f47] to-[#6d5838] border-2 border-[#5d4a32]",
        dark: "bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-gray-700",
        success:
          "bg-gradient-to-b from-game-green-light to-game-green-dark border-2 border-game-green-border",
        error:
          "bg-gradient-to-b from-game-red-light to-game-red-dark border-2 border-game-red-border",
        info: "bg-gradient-to-b from-game-blue-light to-game-blue-dark border-2 border-game-blue-border",
      },
      position: {
        top: "",
        bottom: "",
        left: "",
        right: "",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "top",
    },
  }
);

const arrowVariants = cva(
  ["absolute w-0 h-0", "border-solid", "z-[10000]", "pointer-events-none"],
  {
    variants: {
      variant: {
        default: "",
        dark: "",
        success: "",
        error: "",
        info: "",
      },
      position: {
        top: "border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent",
        bottom:
          "border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent",
        left: "border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent",
        right:
          "border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent",
      },
    },
    compoundVariants: [
      // Top position arrows
      { variant: "default", position: "top", class: "border-t-[#5d4a32]" },
      { variant: "dark", position: "top", class: "border-t-gray-700" },
      {
        variant: "success",
        position: "top",
        class: "border-t-game-green-border",
      },
      { variant: "error", position: "top", class: "border-t-game-red-border" },
      { variant: "info", position: "top", class: "border-t-game-blue-border" },
      // Bottom position arrows
      { variant: "default", position: "bottom", class: "border-b-[#5d4a32]" },
      { variant: "dark", position: "bottom", class: "border-b-gray-700" },
      {
        variant: "success",
        position: "bottom",
        class: "border-b-game-green-border",
      },
      {
        variant: "error",
        position: "bottom",
        class: "border-b-game-red-border",
      },
      {
        variant: "info",
        position: "bottom",
        class: "border-b-game-blue-border",
      },
      // Left position arrows
      { variant: "default", position: "left", class: "border-l-[#5d4a32]" },
      { variant: "dark", position: "left", class: "border-l-gray-700" },
      {
        variant: "success",
        position: "left",
        class: "border-l-game-green-border",
      },
      { variant: "error", position: "left", class: "border-l-game-red-border" },
      { variant: "info", position: "left", class: "border-l-game-blue-border" },
      // Right position arrows
      { variant: "default", position: "right", class: "border-r-[#5d4a32]" },
      { variant: "dark", position: "right", class: "border-r-gray-700" },
      {
        variant: "success",
        position: "right",
        class: "border-r-game-green-border",
      },
      {
        variant: "error",
        position: "right",
        class: "border-r-game-red-border",
      },
      {
        variant: "info",
        position: "right",
        class: "border-r-game-blue-border",
      },
    ],
  }
);

const ARROW_SIZE = 6;
const SHOW_DELAY = 200;
const HIDE_DELAY = 2000;

const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const calculatePosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  position: "top" | "bottom" | "left" | "right"
) => {
  const gap = 8;
  const padding = 8;
  let top = 0;
  let left = 0;

  switch (position) {
    case "top":
      top = triggerRect.top - tooltipRect.height - gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case "bottom":
      top = triggerRect.bottom + gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case "left":
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - gap;
      break;
    case "right":
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + gap;
      break;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left < padding) {
    left = padding;
  } else if (left + tooltipRect.width > viewportWidth - padding) {
    left = viewportWidth - tooltipRect.width - padding;
  }

  if (top < padding) {
    top = padding;
  } else if (top + tooltipRect.height > viewportHeight - padding) {
    top = viewportHeight - tooltipRect.height - padding;
  }

  return { top, left };
};

const calculateArrowPosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  tooltipPos: { top: number; left: number },
  position: "top" | "bottom" | "left" | "right"
) => {
  let top = 0;
  let left = 0;

  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;

  switch (position) {
    case "top":
      top = tooltipPos.top + tooltipRect.height;
      left = clamp(
        triggerCenterX,
        tooltipPos.left + ARROW_SIZE,
        tooltipPos.left + tooltipRect.width - ARROW_SIZE
      );
      break;
    case "bottom":
      top = tooltipPos.top - ARROW_SIZE;
      left = clamp(
        triggerCenterX,
        tooltipPos.left + ARROW_SIZE,
        tooltipPos.left + tooltipRect.width - ARROW_SIZE
      );
      break;
    case "left":
      top = clamp(
        triggerCenterY,
        tooltipPos.top + ARROW_SIZE,
        tooltipPos.top + tooltipRect.height - ARROW_SIZE
      );
      left = tooltipPos.left + tooltipRect.width;
      break;
    case "right":
      top = clamp(
        triggerCenterY,
        tooltipPos.top + ARROW_SIZE,
        tooltipPos.top + tooltipRect.height - ARROW_SIZE
      );
      left = tooltipPos.left - ARROW_SIZE;
      break;
  }

  return { top, left };
};

export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
  children: ReactNode;
  content: string | ReactNode;
  delay?: number;
  className?: string;
  display?: "inline-flex" | "block" | "flex";
}

export const Tooltip = ({
  children,
  content,
  variant = "default",
  position = "top",
  delay = SHOW_DELAY,
  className,
  display = "inline-flex",
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [arrowPos, setArrowPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- defers initial render until after hydration
    setMounted(true);
  }, []);

  // Update tooltip position when visible
  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const updatePositions = () => {
      if (!triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const pos = calculatePosition(
        triggerRect,
        tooltipRect,
        position || "top"
      );
      const arrowPosition = calculateArrowPosition(
        triggerRect,
        tooltipRect,
        pos,
        position || "top"
      );

      setTooltipPos(pos);
      setArrowPos(arrowPosition);
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions, true);

    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions, true);
    };
  }, [isVisible, position]);

  // Handle showing tooltip with delay
  useEffect(() => {
    if (!isHovered) {
      return;
    }

    // Clear any existing show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    // Set new show timeout
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      showTimeoutRef.current = null;
    }, delay);

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
    };
  }, [isHovered, delay]);

  // Handle hiding tooltip with delay
  useEffect(() => {
    if (isHovered) {
      return;
    }

    // Clear any pending show
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    // If tooltip is visible, hide it after delay
    if (isVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        hideTimeoutRef.current = null;
      }, HIDE_DELAY);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [isHovered, isVisible]);

  // Close tooltip immediately on click or scroll
  const closeImmediately = useCallback(() => {
    setIsVisible(false);
    setIsHovered(false);

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Listen for clicks and scrolls when tooltip is visible
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleClick = () => {
      closeImmediately();
    };

    const handleScroll = () => {
      closeImmediately();
    };

    // Small delay to avoid closing on the same click that triggered hover
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClick);
      document.addEventListener("scroll", handleScroll, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isVisible, closeImmediately]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const tooltipContent =
    mounted && isVisible
      ? createPortal(
          <>
            <div
              ref={tooltipRef}
              className={`${tooltipVariants({
                variant,
                position,
              })} ${className} ${isVisible ? "opacity-100" : "opacity-0"}`}
              style={{
                top: `${tooltipPos.top}px`,
                left: `${tooltipPos.left}px`,
              }}
            >
              {content}
            </div>
            <div
              className={arrowVariants({ variant, position })}
              style={{
                position: "fixed",
                top: `${arrowPos.top}px`,
                left: `${arrowPos.left}px`,
                transform:
                  position === "top" || position === "bottom"
                    ? "translateX(-50%)"
                    : "translateY(-50%)",
              }}
            />
          </>,
          document.body
        )
      : null;

  if (!content) {
    return children;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={display}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {tooltipContent}
    </>
  );
};

Tooltip.displayName = "Tooltip";
