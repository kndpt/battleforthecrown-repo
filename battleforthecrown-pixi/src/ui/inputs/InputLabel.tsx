import { LabelHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const labelVariants = cva(
  [
    'block',
    'font-game font-semibold',
    'mb-2',
    'text-gray-700',
  ],
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      required: {
        true: 'after:content-["*"] after:ml-1 after:text-game-red-dark',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      required: false,
    },
  }
);

export interface InputLabelProps
  extends LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  children: ReactNode;
}

export const InputLabel = ({ 
  children, 
  size, 
  required, 
  className, 
  ...props 
}: InputLabelProps) => {
  return (
    <label className={labelVariants({ size, required, className })} {...props}>
      {children}
    </label>
  );
};
