import { type ReactNode } from 'react';

interface ModalBackdropProps {
  children: ReactNode;
  onClose: () => void;
}

export function ModalBackdrop({ children, onClose }: ModalBackdropProps) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex w-full justify-center" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export type { ModalBackdropProps };
