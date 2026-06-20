import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui';
import type { DefeatModalItem } from '@/stores/ui';
import { useWorldMapNavigation } from '@/features/world/worldMapNavigation';
import { useCombatReportsQuery, useMarkReportReadMutation } from '@/api/queries';
import { DefeatModal } from './DefeatModal';

export const DefeatModalHost = () => {
  const defeatItems = useUiStore((state) => state.defeatItems);
  const defeatActiveIndex = useUiStore((state) => state.defeatActiveIndex);
  const setDefeatActiveIndex = useUiStore((state) => state.setDefeatActiveIndex);
  const acknowledgeDefeatItem = useUiStore((state) => state.acknowledgeDefeatItem);
  const pushDefeatItem = useUiStore((state) => state.pushDefeatItem);

  const { navigateToWorldMapFocus } = useWorldMapNavigation();
  const { data: reports, refetch } = useCombatReportsQuery();
  const markRead = useMarkReportReadMutation();

  // Hydratation boot : pousse les reports non lus avec captureFinalized dans le store.
  // La dédup store (par villageId) fusionne avec les éventuels items live déjà présents
  // et complète leur reportId.
  useEffect(() => {
    if (!reports) return;

    for (const r of reports) {
      if (
        r.recipientRole === 'defender' &&
        !r.isRead &&
        r.details?.captureFinalized
      ) {
        const cf = r.details.captureFinalized;
        // Coordonnées : le village perdu est le defenderVillage
        const x = r.defenderX ?? r.targetX;
        const y = r.defenderY ?? r.targetY;

        if (x == null || y == null) continue;

        pushDefeatItem({
          villageId: cf.villageId ?? r.defenderVillageId ?? r.id,
          villageName: cf.villageName ?? r.defenderVillageName ?? 'Village',
          x,
          y,
          conquerorName: cf.conquerorName ?? 'Inconnu',
          visualTier: cf.visualTier ?? 1,
          reportId: r.id,
        });
      }
    }
  }, [reports, pushDefeatItem]);

  if (defeatItems.length === 0) return null;

  // Clamp l'index en cas de désynchronisation (item retiré, etc.)
  const clampedIndex = Math.min(defeatActiveIndex, defeatItems.length - 1);

  const handleAcknowledge = async (item: DefeatModalItem) => {
    let reportId = item.reportId;
    if (!reportId) {
      // Item live poussé par l'event WS avant l'hydratation boot. Le report final
      // est écrit dans la MÊME transaction que la conquête : il existe donc déjà en
      // DB au moment où l'event arrive. Un refetch impératif le résout pour garantir
      // l'acquittement serveur (sinon le report resterait non lu et la modal
      // réapparaîtrait au prochain refresh — cf. critère « ne réapparaît plus »).
      const { data: fresh } = await refetch();
      reportId = fresh?.find(
        (r) =>
          r.recipientRole === 'defender' &&
          !r.isRead &&
          r.details?.captureFinalized &&
          (r.details.captureFinalized.villageId === item.villageId ||
            r.defenderVillageId === item.villageId),
      )?.id;
    }
    // Acquittement serveur-authoritatif : on ne retire l'item localement
    // qu'APRÈS confirmation du PATCH. Si le report reste introuvable ou si le
    // serveur échoue, l'item est conservé pour réessai — sinon la modal
    // réapparaîtrait au prochain boot (report toujours non lu) alors qu'elle a
    // disparu côté client (divergence silencieuse).
    if (!reportId) return;
    markRead.mutate(
      { reportId },
      {
        onSuccess: () => {
          acknowledgeDefeatItem(item.villageId);
        },
      },
    );
  };

  const handleViewVillage = (item: DefeatModalItem) => {
    // Ne ferme pas la modal, ne retire pas l'item — la victime doit acquitter explicitement.
    navigateToWorldMapFocus({ x: item.x, y: item.y });
  };

  return (
    <DefeatModal
      items={defeatItems}
      activeIndex={clampedIndex}
      onSelectIndex={setDefeatActiveIndex}
      onAcknowledge={handleAcknowledge}
      onViewVillage={handleViewVillage}
    />
  );
};
