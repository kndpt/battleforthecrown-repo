import { useMemo } from 'react';
import {
  KingdomActivitiesPanel,
  type KingdomActivitiesPanelLabels,
  type KingdomActivityTab,
} from '@/features/design-system/components';
import {
  useOpenConquestsQuery,
  useOpenExpeditionsQuery,
  useRecallExpeditionMutation,
} from '@/api/queries';
import { useTickingNow } from '@/lib/useTickingNow';
import {
  mapOpenConquestToCaptureCard,
  mapOpenExpeditionToActivityCard,
} from './kingdomActivitiesViewModel';

export interface KingdomActivitiesBottomSheetProps {
  activeTab: KingdomActivityTab;
  onClose: () => void;
  onTabChange: (tab: KingdomActivityTab) => void;
  worldId: string | null;
}

const labels: KingdomActivitiesPanelLabels = {
  captureEmptyQuote: 'Aucune capture en cours.',
  captureEmptyTitle: 'Aucune capture en cours',
  captureErrorLabel: 'Impossible de charger les captures.',
  captureLoadingLabel: 'Chargement des captures...',
  captureRetryLabel: 'Réessayer',
  capturesTab: 'Captures',
  closeLabel: 'Fermer',
  expeditionEmptyQuote: 'Aucune expédition active.',
  expeditionEmptyTitle: 'Aucune expédition active',
  expeditionErrorLabel: 'Impossible de charger les expéditions.',
  expeditionLoadingLabel: 'Chargement des expéditions...',
  expeditionRetryLabel: 'Réessayer',
  expeditionsTab: 'Expéditions',
  headerEyebrow: 'Panneau',
  headerTitle: 'Activités du royaume',
};

export function KingdomActivitiesBottomSheet({
  activeTab,
  onClose,
  onTabChange,
  worldId,
}: KingdomActivitiesBottomSheetProps) {
  const now = useTickingNow(1_000);
  const conquestsQuery = useOpenConquestsQuery(worldId);
  const expeditionsQuery = useOpenExpeditionsQuery(worldId);
  const recallExpedition = useRecallExpeditionMutation();

  const captures = useMemo(
    () => (conquestsQuery.data ?? []).map((conquest) => mapOpenConquestToCaptureCard(conquest, now)),
    [conquestsQuery.data, now],
  );

  const expeditions = useMemo(
    () =>
      (expeditionsQuery.data ?? []).map((expedition) =>
        mapOpenExpeditionToActivityCard(expedition, now, (expeditionId, attackerVillageId) =>
          recallExpedition.mutate({ expeditionId, villageId: attackerVillageId }),
        ),
      ),
    [expeditionsQuery.data, now, recallExpedition],
  );

  return (
    <KingdomActivitiesPanel
      activeTab={activeTab}
      captureCount={conquestsQuery.data?.length ?? 0}
      captureState={queryState(conquestsQuery)}
      captures={captures}
      embedded
      expeditionCount={expeditionsQuery.data?.length ?? 0}
      expeditionState={queryState(expeditionsQuery)}
      expeditions={expeditions}
      labels={labels}
      onClose={onClose}
      onRetryCaptures={() => void conquestsQuery.refetch()}
      onRetryExpeditions={() => void expeditionsQuery.refetch()}
      onTabChange={onTabChange}
    />
  );
}

function queryState(query: { isError: boolean; isLoading: boolean }) {
  if (query.isLoading) return 'loading';
  if (query.isError) return 'error';
  return 'idle';
}
