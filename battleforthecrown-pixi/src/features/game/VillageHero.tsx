import type { ReactNode } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { integerFormatter } from '@/features/layout/headerHelpers';
import { VILLAGE_LABEL_DISPLAY, type VillageLabel } from '@battleforthecrown/shared/village';
import type { HeroParallaxStyles } from './useHeroParallax';
import { HERO_EXPANDED_HEIGHT } from './useHeroParallax';
import { useHeroSwipe } from './useHeroSwipe';

interface VillageHeroProps {
  activeVillage: { id: string; name: string; isCapital?: boolean; label?: string | null } | null;
  activeVillagePower: number;
  availablePopulation: number | undefined;
  canOpenVillageStyle: boolean;
  crownsDisplay: string;
  onOpenProfile: () => void;
  onOpenPower: () => void;
  onOpenVillageSheet: () => void;
  onOpenVillageStyle: () => void;
  parallaxStyles: HeroParallaxStyles;
  playerInitials: string;
  playerLevel: number;
  retentionSlot: ReactNode;
  strategyOption: { name: string; shield: string } | null;
  switchVillage: (direction: -1 | 1) => void;
  totalKingdomPower: number;
  villageCount: number;
  villageId: string;
  villageTier: number;
  villageTransitionClass: string;
}

export function VillageHero({
  activeVillage,
  activeVillagePower,
  availablePopulation,
  canOpenVillageStyle,
  crownsDisplay,
  onOpenProfile,
  onOpenPower,
  onOpenVillageSheet,
  onOpenVillageStyle,
  parallaxStyles: styles,
  playerInitials,
  playerLevel,
  retentionSlot,
  strategyOption,
  switchVillage,
  totalKingdomPower,
  villageCount,
  villageId,
  villageTier,
  villageTransitionClass,
}: VillageHeroProps) {
  const swipe = useHeroSwipe(villageCount, switchVillage);

  return (
    <div
      className="relative shrink-0 touch-pan-y overflow-hidden [overflow-anchor:none] [perspective:900px]"
      onClickCapture={swipe.handleClickCapture}
      onPointerCancel={swipe.handlePointerCancel}
      onPointerDown={swipe.handlePointerDown}
      onPointerUp={swipe.handlePointerUp}
      style={styles.shellStyle}
    >
      <div className="absolute inset-x-0 top-0" style={{ height: HERO_EXPANDED_HEIGHT }}>
        {/* Backgrounds */}
        <div
          className="absolute inset-[-18px] bg-[linear-gradient(180deg,#0d2218_0%,#1b3a1a_40%,#2c1a0a_100%)] will-change-[filter,transform]"
          style={styles.backgroundStyle}
        />
        <div
          className="absolute inset-[-28px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(246,213,123,.18),transparent_65%)] will-change-[opacity,transform]"
          style={styles.glowStyle}
        />

        {/* Village image */}
        <div
          className="absolute inset-x-0 top-[58px] bottom-[138px] flex items-center justify-center px-6 py-2 will-change-[filter,opacity,transform]"
          style={styles.assetParallaxStyle}
        >
          <div
            key={`village-asset-${activeVillage?.id ?? villageId}`}
            className={`village-asset-enter ${villageTransitionClass}`}
          >
            <img
              src={publicAsset(`/assets/world/entity/village-tier${villageTier}.png`)}
              alt="Village"
              className="h-[178px] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Top / bottom vignettes */}
        <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(0,0,0,.65)_0%,transparent_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(26,15,8,1)_0%,transparent_100%)]" />

        {/* Header row */}
        <div
          className="absolute inset-x-0 top-0 flex items-center gap-2.5 px-3 pb-2 pt-3 will-change-[opacity,transform]"
          style={styles.chromeStyle}
        >
          {/* Profile avatar */}
          <button
            type="button"
            aria-label="Ouvrir le profil"
            onClick={onOpenProfile}
            className="relative shrink-0"
          >
            <div className="flex size-11 items-center justify-center rounded-full border-2 border-[#8b6f47] bg-[radial-gradient(circle_at_30%_25%,#7a5a38,#3a2210)] text-[13px] font-bold text-[#f0e0c0] [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">
              {playerInitials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border border-[#7a5200] bg-gradient-to-b from-[#f6d57b] to-[#c9900c] text-[8.5px] font-black text-[#3a2a00]">
              {playerLevel}
            </div>
          </button>

          {/* Power pill */}
          <button
            type="button"
            aria-label="Puissance du royaume"
            onClick={onOpenPower}
            className="flex items-center gap-1.5 rounded-full border border-[#1a120a] bg-[linear-gradient(180deg,#4a3a28,#2a1f14)] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.1)]"
          >
            <img
              src={publicAsset('/assets/power.png')}
              alt="Force"
              className="size-[14px] object-contain"
              loading="lazy"
              decoding="async"
            />
            <span className="tabular-nums text-[12px] font-bold text-[#f0e0c0] [text-shadow:0_1px_1px_rgba(0,0,0,.6)]">
              {integerFormatter.format(totalKingdomPower)}
            </span>
          </button>

          <div className="flex-1" />

          {/* Crown balance */}
          <div className="flex items-center gap-1.5 rounded-full border-2 border-[#7a5200] bg-gradient-to-b from-[#f6d57b] to-[#c9900c] px-3 py-1.5 shadow-[0_2px_0_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.45)]">
            <img
              src={publicAsset('/assets/casual-icons/crown.png')}
              alt="Couronnes"
              className="size-4 object-contain"
              loading="lazy"
              decoding="async"
            />
            <span className="tabular-nums text-[13px] font-extrabold text-[#3a2a00]">
              {crownsDisplay}
            </span>
          </div>

          {retentionSlot}
        </div>

        {/* Village identity and controls */}
        <div
          className="absolute inset-x-0 bottom-0 h-[138px] px-3 will-change-[opacity,transform]"
          style={styles.identityParallaxStyle}
        >
          <div
            key={`village-info-${activeVillage?.id ?? villageId}`}
            className="village-info-enter absolute inset-x-0 bottom-0 h-full text-center"
          >
            <div className="absolute inset-x-3 bottom-[74px] px-2">
              <div className="mb-1 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[.32em] text-[#9a7a5a]">
                <span>Village</span>
                {activeVillage?.isCapital && (
                  <span
                    className="flex size-[17px] items-center justify-center rounded-full border border-[rgba(246,213,123,.35)] bg-[rgba(246,213,123,.16)]"
                    aria-label="Capitale"
                    title="Capitale"
                  >
                    <img
                      src={publicAsset('/assets/casual-icons/crown.png')}
                      alt=""
                      className="size-[10px] object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (villageCount > 1) onOpenVillageSheet();
                }}
                disabled={villageCount <= 1}
                className="mx-auto flex max-w-full items-center justify-center gap-2 disabled:cursor-default"
              >
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap align-bottom text-[16px] font-bold uppercase tracking-[.04em] text-[#f6d57b] [text-shadow:0_2px_6px_rgba(0,0,0,.9)]">
                  {activeVillage?.name ?? '—'}
                </span>
                {villageCount > 1 && (
                  <svg
                    width="10"
                    height="7"
                    viewBox="0 0 10 7"
                    fill="none"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="#f6d57b"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-5 flex h-10 items-center justify-center px-16">
              <div className="flex min-w-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap">
                {strategyOption && (
                  <button
                    type="button"
                    onClick={() => {
                      if (canOpenVillageStyle) onOpenVillageStyle();
                    }}
                    disabled={!canOpenVillageStyle}
                    className="flex min-w-0 items-center gap-1 rounded-full border border-[rgba(205,184,138,.35)] bg-[rgba(0,0,0,.38)] px-2 py-1 disabled:cursor-default disabled:opacity-80"
                    aria-label="Changer le style du village"
                    title={
                      canOpenVillageStyle
                        ? 'Changer le style du village'
                        : 'Construisez la Salle du Conseil pour changer de style'
                    }
                  >
                    <img
                      src={publicAsset(strategyOption.shield)}
                      alt=""
                      className="size-[14px] object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="min-w-0 truncate text-[9.5px] font-bold tracking-[.06em] text-[#d4b87a]">
                      {strategyOption.name}
                    </span>
                  </button>
                )}
                {activeVillage?.label && (
                  <span className="shrink-0 rounded-full border border-[rgba(246,213,123,.45)] bg-[rgba(246,213,123,.18)] px-2 py-1 text-[9.5px] uppercase tracking-[.1em] text-[#f6d57b]">
                    {VILLAGE_LABEL_DISPLAY[activeVillage.label as VillageLabel]}
                  </span>
                )}
                <span
                  aria-label={`Villageois disponibles ${availablePopulation ?? '—'}`}
                  className="flex shrink-0 items-center gap-1 tabular-nums text-[12px] text-[#cdb88a]"
                >
                  <img
                    src={publicAsset('/assets/resources/population.png')}
                    alt=""
                    className="size-[13px] object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  <b className="text-[#fef9f0]">{availablePopulation ?? '—'}</b>
                </span>
                <span className="shrink-0 text-[12px] text-[#cdb88a] opacity-40">·</span>
                <span className="flex shrink-0 items-center gap-1 tabular-nums text-[12px] text-[#cdb88a]">
                  <img
                    src={publicAsset('/assets/power.png')}
                    alt=""
                    className="size-[12px] object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  {integerFormatter.format(activeVillagePower)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => switchVillage(-1)}
            disabled={villageCount <= 1}
            aria-label="Village précédent"
            className="absolute bottom-5 left-3 flex size-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[#0e0805] bg-[linear-gradient(180deg,#3a2a1f,#1f1308)] text-xl font-bold text-[#cdb88a] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.12)] disabled:opacity-30"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => switchVillage(1)}
            disabled={villageCount <= 1}
            aria-label="Village suivant"
            className="absolute bottom-5 right-3 flex size-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[#0e0805] bg-[linear-gradient(180deg,#3a2a1f,#1f1308)] text-xl font-bold text-[#cdb88a] shadow-[0_2px_0_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.12)] disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
