import { useMemo } from 'react';
import {
  KingdomActivitiesPanel,
  type KingdomActivitiesPanelLabels,
  type KingdomActivityTab,
} from '@/features/design-system/components';
import {
  useIncomingAttacksQuery,
  useOpenConquestsQuery,
  useOpenExpeditionsQuery,
  useRecallExpeditionMutation,
} from '@/api/queries';
import { useTickingNow } from '@/lib/useTickingNow';
import {
  mapIncomingAttackToThreatCard,
  mapOpenConquestToCaptureCard,
  mapOpenExpeditionToActivityCard,
} from './kingdomActivitiesViewModel';

export interface KingdomActivitiesBottomSheetProps {
  activeTab: KingdomActivityTab;
  onClose: () => void;
  onTabChange: (tab: KingdomActivityTab) => void;
  villageId: string | null;
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
  threatEmptyQuote: 'Aucune armée ennemie en approche.',
  threatEmptyTitle: 'Aucune attaque entrante',
  threatErrorLabel: 'Impossible de charger les menaces.',
  threatLoadingLabel: 'Analyse des menaces...',
  threatRetryLabel: 'Réessayer',
  threatsTab: 'Menaces',
};

export function KingdomActivitiesBottomSheet({
  activeTab,
  onClose,
  onTabChange,
  villageId,
  worldId,
}: KingdomActivitiesBottomSheetProps) {
  const now = useTickingNow(1_000);
  const conquestsQuery = useOpenConquestsQuery(worldId);
  const expeditionsQuery = useOpenExpeditionsQuery(worldId);
  const incomingAttacksQuery = useIncomingAttacksQuery(villageId);
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

  const threats = useMemo(
    () => (incomingAttacksQuery.data ?? []).map((attack) => mapIncomingAttackToThreatCard(attack, now)),
    [incomingAttacksQuery.data, now],
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
      onRetryThreats={() => void incomingAttacksQuery.refetch()}
      onTabChange={onTabChange}
      threatCount={incomingAttacksQuery.data?.length ?? 0}
      threatState={queryState(incomingAttacksQuery)}
      threats={threats}
    />
  );
}

function queryState(query: { isError: boolean; isLoading: boolean }) {
  if (query.isLoading) return 'loading';
  if (query.isError) return 'error';
  return 'idle';
}
