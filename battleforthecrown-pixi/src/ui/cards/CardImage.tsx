import { ImgHTMLAttributes } from "react";

export interface CardImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
}

export const CardImage = ({
  src,
  alt,
  size = "md",
  className = "",
  ...props
}: CardImageProps) => {
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-[140px] h-[140px]",
    lg: "w-[160px] h-[160px]",
  };

  return (
    <div className="grid place-items-center my-2">
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} object-contain drop-shadow-[0_10px_8px_rgba(0,0,0,0.25)] ${className}`}
        {...props}
      />
    </div>
  );
};
