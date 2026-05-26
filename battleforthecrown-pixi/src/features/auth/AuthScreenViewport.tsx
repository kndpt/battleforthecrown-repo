import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

interface AuthScreenViewportProps {
  children: ReactNode;
  className?: string;
}

export function AuthScreenViewport({ children, className }: AuthScreenViewportProps) {
  return (
    <main
      className={cn(
        'relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#24180f] px-4 py-5 font-game text-[#3d2f1f] sm:px-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(246,213,123,.26),transparent_30%),linear-gradient(180deg,#302031_0%,#77422f_43%,#d99046_68%,#c4aa7b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] bg-[linear-gradient(180deg,rgba(109,88,56,0)_0%,rgba(66,46,28,.42)_100%)]" />
      {children}
    </main>
  );
}

interface AuthRuntimePanelProps {
  children: ReactNode;
  className?: string;
}

export function AuthRuntimePanel({ children, className }: AuthRuntimePanelProps) {
  return (
    <section
      className={cn(
        'relative z-[1] w-full max-w-[430px] rounded-[18px] border-[3px] border-[#3c2619] bg-[linear-gradient(to_bottom,#f5e6d3,#d9bd86)] p-4 shadow-[0_18px_40px_rgba(0,0,0,.42),inset_0_2px_0_rgba(255,255,255,.45)] sm:p-5',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[15px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.32),transparent_42%)]" />
      <div className="relative">{children}</div>
    </section>
  );
}

export function AuthCastleStage() {
  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[430px] sm:h-[270px]">
      <div className="absolute left-1/2 top-[58%] h-[120px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(241,196,15,.34),rgba(241,196,15,0)_68%)] blur-sm" />
      <img
        alt=""
        className="absolute left-1/2 top-[55%] z-[2] w-[145px] -translate-x-1/2 -translate-y-1/2 [filter:drop-shadow(0_12px_14px_rgba(0,0,0,.42))]"
        src={publicAsset('/assets/castle.png')}
      />
      <img
        alt=""
        className="absolute left-[7%] top-[55%] z-[1] w-[82px] -translate-y-1/2 [filter:drop-shadow(0_10px_12px_rgba(0,0,0,.36))]"
        src={publicAsset('/assets/watchtower.png')}
      />
      <img
        alt=""
        className="absolute right-[8%] top-[60%] z-[1] w-[70px] -translate-y-1/2 [filter:drop-shadow(0_8px_10px_rgba(0,0,0,.34))]"
        src={publicAsset('/assets/warehouse.png')}
      />
    </div>
  );
}

