import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  [
    "relative",
    "rounded-2xl",
    "border-[2px]",
    "outline outline-[4px]",
    "transition-all duration-300",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-b from-[#cfd7e1] to-[#8e9aa9]",
          "border-[#dfe6f0]",
          "outline-white",
          "shadow-[0_18px_38px_rgba(23,26,33,0.24),0_6px_10px_rgba(23,26,33,0.18)]",
        ],
        parchment: [
          "bg-gradient-to-b from-[#f4e4c1] to-[#e8d4a8]",
          "border-[#d4c094]",
          "outline-[#f9f3e8]",
          "shadow-[0_18px_38px_rgba(139,111,71,0.24),0_6px_10px_rgba(139,111,71,0.18)]",
        ],
        stone: [
          "bg-gradient-to-b from-[#b0b8c0] to-[#7a828a]",
          "border-[#8a929a]",
          "outline-[#d0d8e0]",
          "shadow-[0_18px_38px_rgba(0,0,0,0.3),0_6px_10px_rgba(0,0,0,0.2)]",
        ],
        wood: [
          "bg-gradient-to-b from-[#a67c52] to-[#7d5a3a]",
          "border-[#5d3a1a]",
          "outline-[#c9a882]",
          "shadow-[0_18px_38px_rgba(93,58,26,0.3),0_6px_10px_rgba(93,58,26,0.2)]",
        ],
      },
      size: {
        sm: "w-full max-w-[280px]", // Mobile: 100%, Desktop: max 280px
        md: "w-full max-w-[360px]", // Mobile: 100%, Desktop: max 360px
        lg: "w-full max-w-[440px]", // Mobile: 100%, Desktop: max 440px
        xl: "w-full max-w-[520px]", // Mobile: 100%, Desktop: max 520px
        fluid: "w-full", // Toujours 100% (par défaut)
      },
    },
    defaultVariants: {
      variant: "parchment",
      size: "fluid", // Mobile-first : par défaut on veut fluid
    },
  }
);

export interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  innerLight?: boolean;
  innerShadow?: boolean;
  /** Étire la carte et prépare un layout en colonne pour caler le footer en bas */
  fill?: boolean;
  /** Classes pour le conteneur interne (utile si besoin) */
  contentClassName?: string;
}

export const Card = ({
  variant,
  size,
  children,
  className,
  innerLight = true,
  innerShadow = true,
  fill = false,
  contentClassName,
}: CardProps) => {
  return (
    <div
      className={cardVariants({
        variant,
        size,
        className: `${className ?? ""} ${fill ? "h-full flex flex-col" : ""}`,
      })}
    >
      {innerLight && (
        <div className="absolute inset-2 rounded-md bg-gradient-to-b from-white/55 to-white/0 pointer-events-none" />
      )}
      {innerShadow && (
        <div className="absolute inset-2 rounded-md shadow-[inset_0_-18px_28px_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.35)] pointer-events-none" />
      )}

      {/* Contenu */}
      <div
        className={`relative ${fill ? "flex flex-col h-full" : ""} ${
          contentClassName ?? ""
        }`}
      >
        {children}
      </div>
    </div>
  );
};
