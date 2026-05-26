import type { CSSProperties, ReactNode } from 'react';

const authScaleStyle = {
  '--auth-scale': 'min(1, calc((100vw - 16px) / 360), calc((100dvh - 16px) / 720))',
} as CSSProperties;

interface AuthScreenViewportProps {
  children: ReactNode;
}

export function AuthScreenViewport({ children }: AuthScreenViewportProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#2f2418] p-2">
      <div
        className="[height:calc(720px*var(--auth-scale))] [width:calc(360px*var(--auth-scale))]"
        style={authScaleStyle}
      >
        <div className="origin-top-left [transform:scale(var(--auth-scale))]">{children}</div>
      </div>
    </main>
  );
}

