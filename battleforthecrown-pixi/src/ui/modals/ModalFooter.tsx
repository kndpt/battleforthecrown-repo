import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const modalFooterVariants = cva([
  'px-6 py-4',
  'bg-gradient-to-b from-[#e8d4a8] to-[#d4c094]',
  'border-t-2 border-[#8b6f47]',
  'rounded-b-md',
  'flex items-center justify-end gap-3',
]);

export interface ModalFooterProps extends VariantProps<typeof modalFooterVariants> {
  children: ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return <div className={modalFooterVariants({ className })}>{children}</div>;
};
