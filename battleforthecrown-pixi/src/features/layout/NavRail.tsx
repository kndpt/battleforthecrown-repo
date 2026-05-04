import { useState } from 'react';
import { StubPanel } from './StubPanel';

type StubKey = 'army' | 'combat' | 'crowns' | 'power' | null;

const STUB_CONTENT: Record<Exclude<StubKey, null>, { title: string; description: string }> = {
  army: {
    title: 'Armée',
    description: "L'entraînement et l'inventaire des troupes arrivent en Phase 3.x. Pour l'instant, le backend est prêt mais l'écran reste à porter depuis le legacy.",
  },
  combat: {
    title: 'Expéditions',
    description: 'Le module combat (envoi d\'attaques, rapports, animations sur la carte) sera porté en Phase 6.',
  },
  crowns: {
    title: 'Couronnes',
    description: 'Le panneau de gestion des couronnes (premium) sera porté en Phase 3.x — le backend pousse déjà les events et le solde s\'affiche dans le header.',
  },
  power: {
    title: 'Puissance',
    description: "Le leaderboard et l'analyse de puissance sont reportés en fin de Phase 3.x.",
  },
};

const NAV_ITEMS: Array<{ key: Exclude<StubKey, null>; label: string; emoji: string }> = [
  { key: 'army', label: 'Armée', emoji: '⚔️' },
  { key: 'combat', label: 'Expéditions', emoji: '🏹' },
  { key: 'crowns', label: 'Couronnes', emoji: '👑' },
  { key: 'power', label: 'Puissance', emoji: '🛡️' },
];

export function NavRail() {
  const [openKey, setOpenKey] = useState<StubKey>(null);

  return (
    <>
      <nav className="pointer-events-auto flex flex-col gap-2 rounded-md border-2 border-game-gold-border bg-[#1a120b]/95 px-2 py-3 shadow-game-inset">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setOpenKey(item.key)}
            className="flex w-full flex-col items-center gap-1 rounded border border-transparent px-2 py-1.5 text-xs uppercase tracking-widest text-parchment hover:border-game-gold-border hover:bg-black/40 hover:text-game-gold-light"
          >
            <span aria-hidden className="text-xl">
              {item.emoji}
            </span>
            <span className="text-[9px]">{item.label}</span>
          </button>
        ))}
      </nav>
      {openKey && (
        <StubPanel
          title={STUB_CONTENT[openKey].title}
          description={STUB_CONTENT[openKey].description}
          onClose={() => setOpenKey(null)}
        />
      )}
    </>
  );
}
