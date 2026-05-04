import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";

const bannerVariants = cva(
  ["absolute left-1/2 -translate-x-1/2 mt-2 top-[-40px]", "z-10"],
  {
    variants: {
      variant: {
        default: "",
        success: "",
        warning: "",
        danger: "",
        info: "",
        gold: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const textVariants = cva(
  [
    "relative",
    "px-10 top-[-18px]",
    "font-cinzel font-bold text-lg uppercase",
    "text-white",
    "text-shadow-game",
    "text-center",
    "flex items-center justify-center",
    "min-w-[250px]",
    "w-72",
  ],
  {
    variants: {
      variant: {
        default: "",
        success: "[text-shadow:_2px_2px_4px_rgb(74_140_42_/_80%)]",
        warning: "[text-shadow:_2px_2px_4px_rgb(255_90_0_/_80%)]",
        danger: "[text-shadow:_2px_2px_4px_rgb(169_50_38_/_80%)]",
        info: "[text-shadow:_2px_2px_4px_rgb(31_82_136_/_80%)]",
        gold: "[text-shadow:_2px_2px_4px_rgb(212_160_23_/_80%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardBannerProps extends VariantProps<typeof bannerVariants> {
  children: ReactNode;
}

export const CardBanner = ({ variant, children }: CardBannerProps) => {
  return (
    <div className={bannerVariants({ variant })}>
      <div className="relative inline-block" style={{ width: "max-content" }}>
        {/* Image de fond */}
        <Image
          src="/assets/ui/banner.png"
          alt=""
          width={350}
          height={120}
          className="object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]"
          priority
        />

        {/* Texte par-dessus */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={textVariants({ variant })}>{children}</span>
        </div>
      </div>
    </div>
  );
};
