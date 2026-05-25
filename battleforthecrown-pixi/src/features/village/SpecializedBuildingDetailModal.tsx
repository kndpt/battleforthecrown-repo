import { Clock, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ArmyTrainingDto } from '@/api/queries';
import type { BuildingDto } from '@/api';
import {
  BuildingModal,
  type BuildingModalAccent,
  type BuildingModalAction,
  type BuildingModalBadge,
} from '@/features/design-system/components';
import { computeUnitTrainingProgress } from '@/features/army/trainingProgress';
import { unitMetaFor } from '@/features/army/unitConfig';
import { publicAsset } from '@/lib/publicAsset';
import { Button, InputHelperText, ProgressBar, ResourceIcon, Spinner } from '@/ui';
import { UNIT_COSTS, UNIT_TYPES } from '@battleforthecrown/shared/army';
import { MAX_CONSTRUCTION_QUEUE } from '@battleforthecrown/shared/village/buildings';
import type { BuildingLevelDefinition, BuildingType } from '@battleforthecrown/shared/village/buildings';
import type { DisplayResources } from '@/lib/interpolation';
import { formatRemaining } from './constructionProgress';
import type { BuildingMeta } from './buildingMeta';
import { metaFor } from './buildingMeta';
import type { BuildingLockState } from './buildingLockState';
import {
  formatConstructionSpeed,
  formatSpeedBonus,
  getBarracksTrainingSpeedComparison,
  getBarracksUnlockGroups,
  getCastleConstructionSpeedComparison,
  getCastleUnlockGroups,
  getWarehouseStorageComparison,
  getWatchtowerVisionComparison,
} from './buildingModalContent';

interface SpecializedBuildingDetailModalProps {
  availablePopulation: number;
  building: BuildingDto;
  canAfford: boolean;
  canAffordNoble: boolean;
  cancelConstructionPending: boolean;
  cancelTrainingPending: boolean;
  crownsBalance: number | null;
  displayResources: DisplayResources | null;
  effectiveTimeMs: number | null;
  error: string | null;
  isMaxLevel: boolean;
  isQueueFull: boolean;
  lockState: BuildingLockState;
  meta: BuildingMeta;
  nextCost: BuildingLevelDefinition | null;
  nobleInGarrison: boolean;
  nobleTimeMs: number;
  nobleTraining: ArmyTrainingDto | undefined;
  now: number;
  onCancelConstruction: () => void;
  onCancelNobleTraining: () => void;
  onClose: () => void;
  onRecruitNoble: () => void;
  onUpgrade: () => void;
  progress: { inProgress: boolean; percent: number; remainingMs: number };
  queueLength: number;
  recruitNoblePending: boolean;
  upgradePending: boolean;
}

const BUILDING_ACCENTS: Partial<Record<BuildingType, BuildingModalAccent>> = {
  BARRACKS: { border: '#7a241c', dark: '#b9472f', haloTint: 'rgba(231,76,60,.28)', light: '#e47a44' },
  CASTLE: { border: '#9e7b0d', dark: '#d4a017', haloTint: 'rgba(241,196,15,.36)', light: '#f1c40f' },
  COUNCIL_HALL: { border: '#5d4a32', dark: '#8b7355', haloTint: 'rgba(166,124,82,.32)', light: '#b6a78a' },
  THRONE_HALL: { border: '#8b5f18', dark: '#b8860b', haloTint: 'rgba(255,215,120,.42)', light: '#f1c40f' },
  WAREHOUSE: { border: '#5d6d6e', dark: '#7f8c8d', haloTint: 'rgba(176,184,192,.35)', light: '#b0b8c0' },
  WATCHTOWER: { border: '#1f5288', dark: '#2e75b6', haloTint: 'rgba(91,155,213,.36)', light: '#5b9bd5' },
};

const DEFAULT_ACCENT: BuildingModalAccent = {
  border: '#5d4a32',
  dark: '#8b7355',
  haloTint: 'rgba(166,124,82,.26)',
  light: '#b6a78a',
};

function fr(value: number) {
  return Math.floor(value).toLocaleString('fr-FR');
}

function buildingAccent(type: string): BuildingModalAccent {
  return BUILDING_ACCENTS[type as BuildingType] ?? DEFAULT_ACCENT;
}

function buildingBadge(type: string): BuildingModalBadge {
  if (type === 'CASTLE') return { icon: '/assets/casual-icons/crown.png', label: 'Commandement' };
  if (type === 'WAREHOUSE') return { icon: '/assets/resources/wood.png', label: 'Stockage' };
  if (type === 'BARRACKS') return { icon: '/assets/barracks.png', label: 'Militaire' };
  if (type === 'WATCHTOWER') return { icon: '/assets/watchtower.png', label: 'Vision' };
  if (type === 'THRONE_HALL') return { icon: '/assets/throne-hall.png', label: 'Conquête' };
  return { label: 'Bâtiment' };
}

function StatCard({
  accent,
  current,
  icon,
  label,
  next,
}: {
  accent: BuildingModalAccent;
  current: string;
  icon?: string;
  label: string;
  next: string;
}) {
  return (
    <div className="rounded-[14px] border-2 border-[rgba(60,38,25,.24)] bg-[linear-gradient(to_bottom,rgba(255,255,255,.58),rgba(244,228,193,.55))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_2px_0_rgba(0,0,0,.08)]">
      <div className="mb-2 flex items-center gap-2">
        {icon ? <img alt="" className="size-5 object-contain" src={publicAsset(icon)} /> : null}
        <span className="font-game text-[9px] font-extrabold uppercase tracking-[.22em] text-[#6d5838]">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <ValuePill label="Actuel" value={current} />
        <span className="font-game text-sm font-black" style={{ color: accent.border }}>→</span>
        <ValuePill label="Prochain" tone="next" value={next} />
      </div>
    </div>
  );
}

function ValuePill({
  label,
  tone = 'current',
  value,
}: {
  label: string;
  tone?: 'current' | 'next';
  value: string;
}) {
  return (
    <div className={tone === 'next'
      ? 'rounded-[10px] border border-[#3a6c1f] bg-[rgba(110,191,73,.18)] px-2 py-2 text-center'
      : 'rounded-[10px] border border-[rgba(60,38,25,.24)] bg-[rgba(255,255,255,.5)] px-2 py-2 text-center'}
    >
      <div className="font-game text-[8px] font-bold uppercase tracking-[.18em] text-[#6d5838]">{label}</div>
      <div className={tone === 'next'
        ? 'font-game text-[15px] font-black text-[#3a6c1f] tabular-nums'
        : 'font-game text-[15px] font-black text-[#3d2f1f] tabular-nums'}
      >
        {value}
      </div>
    </div>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="mx-3.5 mb-2 mt-3 flex items-center gap-2">
      <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
      <span className="font-game text-[9px] font-extrabold uppercase tracking-[.24em] text-[#6d5838]">{label}</span>
      <span className="h-px flex-1 bg-[rgba(60,38,25,.22)]" />
    </div>
  );
}

function CostChip({
  current,
  icon,
  value,
}: {
  current: number;
  icon: ReactNode;
  value: number;
}) {
  const ok = current >= value;
  return (
    <span className={ok
      ? 'inline-flex h-[22px] items-center gap-1 rounded-full border-[1.5px] border-[rgba(0,0,0,.3)] bg-[rgba(0,0,0,.22)] py-0 pl-1 pr-[7px] font-game text-[10.5px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]'
      : 'inline-flex h-[22px] items-center gap-1 rounded-full border-[1.5px] border-[#a93226] bg-[linear-gradient(to_bottom,rgba(192,57,43,.45),rgba(192,57,43,.7))] py-0 pl-1 pr-[7px] font-game text-[10.5px] font-bold text-[#ffe2dc] shadow-[inset_0_0_8px_rgba(192,57,43,.4)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]'}
    >
      {icon}
      {fr(value)}
    </span>
  );
}

function UpgradeCostStrip({
  availablePopulation,
  cost,
  displayResources,
  label,
  time,
}: {
  availablePopulation: number;
  cost: BuildingLevelDefinition | null;
  displayResources: DisplayResources | null;
  label: string;
  time: string;
}) {
  if (!cost) return null;
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.96),rgba(78,56,34,.96))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_2px_0_rgba(0,0,0,.2)]">
      <div className="flex items-center justify-between">
        <span className="font-game text-[9.5px] font-bold uppercase tracking-[.18em] text-[#f0e0c0]">{label}</span>
        <span className="inline-flex items-center gap-1 font-game text-[9px] font-bold tracking-[.14em] text-[#cdb88a]">
          <img alt="" className="size-3 object-contain" src={publicAsset('/assets/clock.png')} />
          {time}
        </span>
      </div>
      <div className="flex flex-wrap gap-[5px]">
        <CostChip current={displayResources?.wood ?? 0} icon={<ResourceIcon resource="wood" size={14} />} value={cost.wood} />
        <CostChip current={displayResources?.stone ?? 0} icon={<ResourceIcon resource="stone" size={14} />} value={cost.stone} />
        <CostChip current={displayResources?.iron ?? 0} icon={<ResourceIcon resource="iron" size={14} />} value={cost.iron} />
        <CostChip current={availablePopulation} icon={<ResourceIcon resource="population" size={14} />} value={cost.population} />
      </div>
    </div>
  );
}

function CastleContent({ accent, level }: { accent: BuildingModalAccent; level: number }) {
  const speed = getCastleConstructionSpeedComparison(level);
  const unlocks = getCastleUnlockGroups(level);
  return (
    <>
      <SectionRule label="Vitesse du royaume" />
      <div className="mx-3.5">
        <StatCard
          accent={accent}
          current={formatConstructionSpeed(speed.current)}
          icon="/assets/clock.png"
          label="Construction"
          next={formatConstructionSpeed(speed.next)}
        />
      </div>
      <SectionRule label="Déblocages à venir" />
      <div className="mx-3.5 mb-3 grid gap-2">
        {unlocks.length > 0 ? unlocks.map((group) => (
          <div className="rounded-[12px] border border-[rgba(60,38,25,.22)] bg-[rgba(255,255,255,.45)] p-2.5" key={group.level}>
            <div className="mb-1 font-game text-[9px] font-extrabold uppercase tracking-[.2em] text-[#6d5838]">
              Château niv. {group.level}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.buildings.map((building) => {
                const meta = metaFor(building);
                return (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(60,38,25,.24)] bg-[rgba(255,255,255,.55)] px-2 py-1 font-game text-[10px] font-bold text-[#3d2f1f]" key={building}>
                    {meta.iconPath ? <img alt="" className="size-4 object-contain" src={meta.iconPath} /> : meta.emoji}
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        )) : (
          <div className="rounded-[12px] border border-[rgba(60,38,25,.22)] bg-[rgba(255,255,255,.45)] p-3 text-center font-game text-[10.5px] font-bold text-[#6d5838]">
            Aucun nouveau bâtiment actif à débloquer.
          </div>
        )}
      </div>
    </>
  );
}

function WarehouseContent({ accent, level }: { accent: BuildingModalAccent; level: number }) {
  const storage = getWarehouseStorageComparison(level);
  return (
    <>
      <SectionRule label="Capacité de stockage" />
      <div className="mx-3.5 mb-3">
        <StatCard
          accent={accent}
          current={storage.current === null ? 'Aucun' : fr(storage.current)}
          icon="/assets/warehouse.png"
          label="Par ressource"
          next={storage.next === null ? 'Max.' : fr(storage.next)}
        />
      </div>
    </>
  );
}

function BarracksContent({ accent, level }: { accent: BuildingModalAccent; level: number }) {
  const speed = getBarracksTrainingSpeedComparison(level);
  const unlockGroups = getBarracksUnlockGroups();
  return (
    <>
      <SectionRule label="Vitesse d'entraînement" />
      <div className="mx-3.5">
        <StatCard
          accent={accent}
          current={formatSpeedBonus(speed.current)}
          icon="/assets/barracks.png"
          label="Bonus Caserne"
          next={formatSpeedBonus(speed.next)}
        />
      </div>
      <SectionRule label="Unités débloquées" />
      <div className="mx-3.5 mb-3 grid gap-2">
        {unlockGroups.map((group) => {
          const active = level >= group.level;
          return (
            <div className={active
              ? 'rounded-[12px] border border-[#3a6c1f] bg-[rgba(110,191,73,.16)] p-2.5'
              : 'relative overflow-hidden rounded-[12px] border border-[#b7aa92] bg-[linear-gradient(135deg,rgba(205,197,176,.42),rgba(255,255,255,.38))] p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)]'}
              key={group.level}
            >
              {!active ? (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,rgba(84,75,63,.08)_0,rgba(84,75,63,.08)_8px,transparent_8px,transparent_16px)]" />
                  <img
                    alt=""
                    className="absolute right-5 top-1/2 size-12 -translate-y-1/2 object-contain opacity-85 drop-shadow-[0_2px_1px_rgba(0,0,0,.25)]"
                    src={publicAsset('/assets/lock.png')}
                  />
                </>
              ) : null}
              <div className={active
                ? 'relative mb-1 font-game text-[9px] font-extrabold uppercase tracking-[.2em] text-[#6d5838]'
                : 'relative mb-1 pr-9 font-game text-[9px] font-extrabold uppercase tracking-[.2em] text-[#8b7a61]'}
              >
                Caserne niv. {group.level}
              </div>
              <div className="relative flex flex-wrap gap-1.5">
                {group.units.map((unit) => {
                  const meta = unitMetaFor(unit);
                  return (
                    <span className={active
                      ? 'inline-flex items-center gap-1 rounded-full border border-[rgba(60,38,25,.24)] bg-[rgba(255,255,255,.58)] px-2 py-1 font-game text-[10px] font-bold text-[#3d2f1f]'
                      : 'inline-flex items-center gap-1 rounded-full border border-[#c9bea9] bg-[rgba(247,241,226,.6)] px-2 py-1 font-game text-[10px] font-bold text-[#6f624f] grayscale'}
                      key={unit}
                    >
                      {meta.iconPath ? <img alt="" className={active ? 'size-4 object-contain' : 'size-4 object-contain opacity-55'} src={publicAsset(meta.iconPath)} /> : meta.emoji}
                      {meta.name}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function WatchtowerContent({ accent, level }: { accent: BuildingModalAccent; level: number }) {
  const vision = getWatchtowerVisionComparison(level);
  return (
    <>
      <SectionRule label="Rayon du village" />
      <div className="mx-3.5">
        <StatCard
          accent={accent}
          current={vision.current === null ? 'Aucun' : `${vision.current} cases`}
          icon="/assets/watchtower.png"
          label="Vision locale"
          next={vision.next === null ? 'Max.' : `${vision.next} cases`}
        />
      </div>
      <SectionRule label="Vision multi-village" />
      <div className="mx-3.5 mb-3 rounded-[14px] border-2 border-[#1f5288] bg-[linear-gradient(to_bottom,rgba(91,155,213,.18),rgba(255,255,255,.5))] p-3">
        <div className="mb-2 rounded-[12px] border border-dashed border-[#1f5288] bg-[rgba(31,82,136,.08)] px-3 py-7 text-center font-game text-[10.5px] font-extrabold uppercase tracking-[.16em] text-[#1f5288]">
          image simulation des rayons qui se touchent
        </div>
        <p className="font-game text-[10.5px] font-bold leading-snug text-[#31506d]">
          La carte combine les disques de vision de tous vos villages. Une tour seule ne révèle pas tout le monde : les conquêtes avancées étendent le réseau.
        </p>
      </div>
    </>
  );
}

function ThroneHallContent({
  availablePopulation,
  canAffordNoble,
  cancelTrainingPending,
  crownsBalance,
  displayResources,
  nobleInGarrison,
  nobleTimeMs,
  nobleTraining,
  now,
  onCancelNobleTraining,
  onRecruitNoble,
  recruitNoblePending,
}: Pick<
  SpecializedBuildingDetailModalProps,
  | 'availablePopulation'
  | 'canAffordNoble'
  | 'cancelTrainingPending'
  | 'crownsBalance'
  | 'displayResources'
  | 'nobleInGarrison'
  | 'nobleTimeMs'
  | 'nobleTraining'
  | 'now'
  | 'onCancelNobleTraining'
  | 'onRecruitNoble'
  | 'recruitNoblePending'
>) {
  const nobleCost = UNIT_COSTS[UNIT_TYPES.NOBLE];
  return (
    <>
      <SectionRule label="Seigneur" />
      <div className="mx-3.5 mb-3 rounded-[16px] border-[3px] border-[#8b5f18] bg-[linear-gradient(160deg,rgba(241,196,15,.28),rgba(255,255,255,.6))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_3px_0_rgba(0,0,0,.12)]">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[14px] border-2 border-[#8b5f18] bg-[linear-gradient(to_bottom,#f1c40f,#b8860b)] text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_3px_0_rgba(0,0,0,.16)]">
            👑
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-game text-[15px] font-black text-[#3d2f1f]">Recruter le Seigneur</div>
            <p className="mt-1 font-game text-[10.5px] font-bold leading-snug text-[#6d5838]">
              Un seul Seigneur peut être disponible ou en formation par village. Il ouvre la conquête et reste une cible tant qu'il attend.
            </p>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-[5px]">
          <CostChip current={displayResources?.wood ?? 0} icon={<ResourceIcon resource="wood" size={14} />} value={nobleCost.wood} />
          <CostChip current={displayResources?.stone ?? 0} icon={<ResourceIcon resource="stone" size={14} />} value={nobleCost.stone} />
          <CostChip current={displayResources?.iron ?? 0} icon={<ResourceIcon resource="iron" size={14} />} value={nobleCost.iron} />
          <CostChip current={crownsBalance ?? 0} icon={<img alt="" className="size-4 object-contain" src={publicAsset('/assets/crown.png')} />} value={nobleCost.crowns ?? 0} />
          <CostChip current={availablePopulation} icon={<img alt="" className="size-4 object-contain" src={publicAsset('/assets/resources/population.png')} />} value={nobleCost.population} />
        </div>
        {nobleTraining ? (
          <NobleTrainingProgress
            cancelPending={cancelTrainingPending}
            now={now}
            onCancel={onCancelNobleTraining}
            training={nobleTraining}
          />
        ) : (
          <>
            <Button
              className="w-full font-bold"
              disabled={!canAffordNoble || recruitNoblePending}
              onClick={onRecruitNoble}
              size="md"
              variant={canAffordNoble ? 'warning' : 'neutral'}
            >
              {recruitNoblePending ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>Recrutement...</span>
                </div>
              ) : nobleInGarrison ? (
                'Seigneur déjà disponible'
              ) : canAffordNoble ? (
                'Recruter le Seigneur'
              ) : (
                'Prérequis insuffisants'
              )}
            </Button>
            <p className="mt-2 text-center font-game text-[10px] font-bold text-[#6d5838]">
              Temps de recrutement : <span className="text-[#3d2f1f]">{formatRemaining(nobleTimeMs)}</span>
            </p>
          </>
        )}
      </div>
    </>
  );
}

function NobleTrainingProgress({
  cancelPending,
  now,
  onCancel,
  training,
}: {
  cancelPending: boolean;
  now: number;
  onCancel: () => void;
  training: ArmyTrainingDto;
}) {
  const progress = computeUnitTrainingProgress(training, now);
  const eta = new Date(progress.finishedAtMs).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-[12px] border-2 border-[#8b5f18] bg-[rgba(255,255,255,.62)] p-3 shadow-inner">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-game text-[12px] font-black text-[#3d2f1f]">
            <Clock size={16} className="text-[#8b5f18]" />
            <span>Seigneur en formation</span>
          </div>
          <p className="mt-1 font-game text-[10px] font-bold text-[#6d5838]">
            {progress.displayedCompletedQty}/{training.totalQty} · fin à {eta}
          </p>
        </div>
        <Button
          className="shrink-0 !px-2"
          disabled={cancelPending}
          onClick={onCancel}
          size="sm"
          variant="danger"
        >
          <div className="flex items-center justify-center gap-1">
            {cancelPending ? <Spinner size="sm" /> : <XCircle size={14} />}
            <span>Annuler</span>
          </div>
        </Button>
      </div>
      <ProgressBar animated showPercentage={false} size="sm" value={progress.percent} variant="warning" />
      <div className="mt-2 flex items-center justify-between font-game text-[10px] font-bold text-[#6d5838]">
        <span>Restant : {formatRemaining(progress.totalRemainingMs)}</span>
        <span>Jalon : {formatRemaining(progress.currentUnitRemainingMs)}</span>
      </div>
    </div>
  );
}

function BuildingSpecificContent(props: SpecializedBuildingDetailModalProps & { accent: BuildingModalAccent }) {
  if (props.building.type === 'CASTLE') return <CastleContent accent={props.accent} level={props.building.level} />;
  if (props.building.type === 'WAREHOUSE') return <WarehouseContent accent={props.accent} level={props.building.level} />;
  if (props.building.type === 'BARRACKS') return <BarracksContent accent={props.accent} level={props.building.level} />;
  if (props.building.type === 'WATCHTOWER') return <WatchtowerContent accent={props.accent} level={props.building.level} />;
  if (props.building.type === 'THRONE_HALL' && props.building.level > 0 && props.lockState.state !== 'in-progress') {
    return <ThroneHallContent {...props} />;
  }
  return null;
}

export function SpecializedBuildingDetailModal(props: SpecializedBuildingDetailModalProps) {
  const {
    availablePopulation,
    building,
    canAfford,
    cancelConstructionPending,
    displayResources,
    effectiveTimeMs,
    error,
    isMaxLevel,
    isQueueFull,
    lockState,
    meta,
    nextCost,
    onCancelConstruction,
    onClose,
    onUpgrade,
    queueLength,
    upgradePending,
  } = props;
  const accent = buildingAccent(building.type);
  const isLockedByCastle = lockState.state === 'unbuilt-locked' && lockState.requiredCastleLevel !== null;
  const construction = lockState.state === 'in-progress'
    ? {
        progressPercent: props.progress.percent,
        remainingLabel: `${formatRemaining(props.progress.remainingMs)} restant`,
      }
    : undefined;
  const canUpgrade = !isLockedByCastle && !isMaxLevel && !isQueueFull && canAfford && !upgradePending && nextCost !== null && lockState.state !== 'in-progress';
  const actions: BuildingModalAction[] = [
    { id: 'close', label: 'Fermer', tone: 'neutral' },
    ...(lockState.state === 'in-progress'
      ? [{
          disabled: cancelConstructionPending,
          id: 'cancel-construction',
          label: cancelConstructionPending ? 'Annulation...' : 'Annuler la construction',
          tone: 'danger' as const,
        }]
      : isMaxLevel
        ? []
        : [{
            disabled: !canUpgrade,
            id: 'upgrade',
            label: isLockedByCastle
              ? `Château niv. ${lockState.requiredCastleLevel} requis`
              : isQueueFull
                ? `File pleine (${queueLength}/${MAX_CONSTRUCTION_QUEUE})`
                : upgradePending
                  ? 'Amélioration...'
                  : 'Améliorer',
            tone: 'success' as const,
          }]),
  ];
  const notice = isLockedByCastle
    ? {
        body: `Niveau actuel du Château : ${lockState.castleLevel}`,
        title: `Château niv. ${lockState.requiredCastleLevel} requis`,
        tone: 'warning' as const,
      }
    : undefined;

  const handleAction = (action: BuildingModalAction) => {
    if (action.id === 'close') {
      onClose();
      return;
    }
    if (action.id === 'cancel-construction' && !action.disabled) onCancelConstruction();
    if (action.id === 'upgrade' && canUpgrade) onUpgrade();
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.62)] p-3 [backdrop-filter:blur(3px)]"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex w-full justify-center" onClick={(event) => event.stopPropagation()}>
        <BuildingModal
          accent={accent}
          actions={actions}
          buildingIcon={meta.iconPath ?? '/assets/castle.png'}
          construction={construction}
          eyebrow="Bâtiment"
          footerClassName="px-3.5 pb-3 pt-2.5"
          footerContent={lockState.state !== 'in-progress' && !isMaxLevel && !isLockedByCastle ? (
            <UpgradeCostStrip
              availablePopulation={availablePopulation}
              cost={nextCost}
              displayResources={displayResources}
              label={`Améliorer · Niv. ${building.level} → ${building.level + 1}`}
              time={effectiveTimeMs !== null ? formatRemaining(effectiveTimeMs) : '—'}
            />
          ) : null}
          footerHint={isQueueFull && lockState.state !== 'in-progress' ? `File pleine (${queueLength}/${MAX_CONSTRUCTION_QUEUE})` : undefined}
          labels={{ close: 'Fermer', subtitle: 'Bâtiment' }}
          level={building.level}
          name={meta.label}
          notice={notice}
          onAction={handleAction}
          summaryBadges={[buildingBadge(building.type)]}
          summaryLabel={isMaxLevel ? 'Niveau maximal' : undefined}
          tagline={meta.description}
        >
          <BuildingSpecificContent {...props} accent={accent} />
          {error ? (
            <div className="mx-3.5 mb-3" role="alert">
              <InputHelperText variant="error">{error}</InputHelperText>
            </div>
          ) : null}
        </BuildingModal>
      </div>
    </div>
  );
}
