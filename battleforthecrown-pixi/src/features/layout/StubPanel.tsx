import { Button } from '@/ui/buttons';

interface StubPanelProps {
  title: string;
  description: string;
  onClose: () => void;
}

export function StubPanel({ title, description, onClose }: StubPanelProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-md border-4 border-dashed border-game-gold-border bg-[#2a1f12] p-5 text-parchment shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 className="font-game text-xl text-game-gold-light text-shadow-game">{title}</h2>
          <p className="mt-1 text-sm text-parchment/80">{description}</p>
        </header>
        <Button variant="neutral" size="md" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
