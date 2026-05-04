import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const modalBodyVariants = cva([
  'px-6 py-5',
  'text-gray-800',
  'overflow-y-auto',
  'max-h-[70vh]',
]);

export interface ModalBodyProps extends VariantProps<typeof modalBodyVariants> {
  children: ReactNode;
  className?: string;
}

export const ModalBody = ({ children, className }: ModalBodyProps) => {
  return <div className={modalBodyVariants({ className })}>{children}</div>;
};
