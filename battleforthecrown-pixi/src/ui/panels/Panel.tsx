import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const panelVariants = cva(
  ["rounded-lg border-2 overflow-hidden", "shadow-[0_4px_8px_rgba(0,0,0,0.2)]"],
  {
    variants: {
      variant: {
        default: ["bg-[#f5e6d3]", "border-[#8b7355]"],
        parchment: [
          "bg-gradient-to-br from-[#f5e6d3] via-[#e8d5b7] to-[#d4c094]",
          "border-[#8b7355]",
        ],
        wood: [
          "bg-gradient-to-br from-[#8b6f47] via-[#6f5139] to-[#5d4a32]",
          "border-[#3d2f1f]",
        ],
        stone: [
          "bg-gradient-to-br from-[#a0a0a0] via-[#808080] to-[#606060]",
          "border-[#404040]",
        ],
        success: [
          "bg-gradient-to-br from-game-green-light to-game-green-dark",
          "border-game-green-border",
        ],
        info: [
          "bg-gradient-to-br from-game-blue-light to-game-blue-dark",
          "border-game-blue-border",
        ],
        warning: [
          "bg-gradient-to-br from-game-gold-light to-game-gold-dark",
          "border-game-gold-border",
        ],
        danger: [
          "bg-gradient-to-br from-game-red-light to-game-red-dark",
          "border-game-red-border",
        ],
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export interface PanelProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {
  children: ReactNode;
  opacity?: number;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      variant = "default",
      padding = "md",
      opacity = 1,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={panelVariants({ variant, padding, className })}
        style={{ opacity, ...props.style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = "Panel";
