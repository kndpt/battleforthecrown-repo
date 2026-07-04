import { BaseModal } from '@/features/design-system/components/BaseModal';
import type { VillageNaturalTrait } from '@battleforthecrown/shared/village';
import { naturalTraitInfo } from './naturalTraitInfo';

export interface NaturalTraitModalProps {
  onClose: () => void;
  trait: VillageNaturalTrait;
}

/**
 * Modal d'info du trait naturel de village. Identique quelle que soit la
 * variante de badge qui l'ouvre (spec 093 § « Variantes d'affichage du
 * badge »). Le trait est **fixe et permanent** : lié à la tile, jamais
 * modifiable — cf. `docs/gameplay/27-village-natural-traits.md`.
 */
export function NaturalTraitModal({ onClose, trait }: NaturalTraitModalProps) {
  const info = naturalTraitInfo(trait);

  return (
    <BaseModal
      closeLabel="Fermer"
      onClose={onClose}
      title="Trait naturel"
      tone="brown"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <img
          alt=""
          className="size-20 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,.35)]"
          src={info.iconAsset}
        />
        <div className="font-game text-lg font-black tracking-[.02em] text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.55)]">
          {info.label}
        </div>
        <div className="rounded-full border-[1.5px] border-[rgba(120,200,140,.5)] bg-[rgba(30,60,35,.12)] px-3 py-1 font-game text-xs font-extrabold tracking-[.04em] text-[#2d5a34]">
          {info.bonusLabel}
        </div>
        {info.boostedResourceLabel ? (
          <p className="font-game text-[11px] text-[#6d5838]">
            Ressource concernée : {info.boostedResourceLabel}
          </p>
        ) : null}
        <p className="border-t border-[rgba(60,38,25,.22)] pt-2.5 font-game text-[11px] italic text-[#6d5838]">
          Ce trait est gravé dans la terre du village : fixe et permanent, il ne
          dépend d'aucun bâtiment et ne peut être changé.
        </p>
      </div>
    </BaseModal>
  );
}
