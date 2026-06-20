import { useEffect } from 'react';
import { useCombatReportsQuery } from '@/api/queries';
import { useUiStore } from '@/stores/ui';

/**
 * Rebuilds the defeat carousel from persisted state so it survives refresh /
 * reconnection (server-authoritative acknowledgement, PISTE B). Loads the
 * defender's unread `captureFinalized` reports and pushes one item per lost
 * village. Dedup is by `villageId`, so this also backfills the stable `reportId`
 * onto any item already added live via the `village.conquered` WS event — which
 * is what lets "Valider" mark the report read and stop it from reappearing.
 */
export function useDefeatCarouselHydration(): void {
  const { data: reports } = useCombatReportsQuery();
  const pushDefeatItem = useUiStore((s) => s.pushDefeatItem);

  useEffect(() => {
    if (!reports) return;
    for (const report of reports) {
      const capture = report.details?.captureFinalized;
      if (!capture) continue;
      if (report.recipientRole !== 'defender') continue;
      if (report.isRead) continue;

      const villageId = capture.villageId ?? report.defenderVillageId;
      if (!villageId) continue;

      pushDefeatItem({
        villageId,
        villageName:
          capture.villageName ?? report.defenderVillageName ?? 'Village',
        x: report.defenderX ?? report.targetX,
        y: report.defenderY ?? report.targetY,
        newOwnerName: capture.newOwnerName ?? 'Un seigneur ennemi',
        castleLevel: capture.castleLevel ?? null,
        reportId: report.id,
      });
    }
  }, [reports, pushDefeatItem]);
}
