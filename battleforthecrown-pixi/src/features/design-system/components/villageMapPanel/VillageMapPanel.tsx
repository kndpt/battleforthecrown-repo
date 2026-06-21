import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';
import { BftcButton } from '@/features/design-system/components/BftcButton';
import type { VillageMapVariant, VillageMapTypeTag, BarbarianTier } from './meta';
import {
  VillageTile,
  CoordPill,
  TypeTag,
  PowerCell,
  CloseBtn,
  ClockGlyph,
} from './primitives';
import { UnscoutedPanel, FullIntelPanel, TierPanel } from './bodies';
import type { FullIntelPanelProps } from './bodies';

// ---------------------------------------------------------------------------
// Re-export props types from bodies for barrel
// ---------------------------------------------------------------------------

export type { FullIntelPanelProps };

// ---------------------------------------------------------------------------
// VillageMapPanelProps
// ---------------------------------------------------------------------------

export interface VillageMapPanelProps {
  variant: VillageMapVariant;
  name: string;
  coords: string;
  typeTag: VillageMapTypeTag;
  owner?: string | null;
  villagePower?: number | null;
  ownerPower?: number | null;
  intel?: FullIntelPanelProps;
  tier?: BarbarianTier;
  /** Preview lecture seule de la durée de fenêtre de capture PvP (ex `4h30`). */
  captureWindowLabel?: string | null;
  attackBlocked?: boolean;
  attackBlockedReason?: string | null;
  onClose?: () => void;
  onEnter?: () => void;
  onSendResources?: () => void;
  onReinforce?: () => void;
  onScout?: () => void;
  onAttack?: () => void;
  onViewReport?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Local SVG glyphs
// ---------------------------------------------------------------------------

function EnterGlyph({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <path d="M10 17l5-5-5-5"/>
      <path d="M15 12H3"/>
    </svg>
  );
}

function ShieldGlyph({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function ScrollGlyph({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
      <path d="M2 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2H6"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CaptureWindowRow — preview lecture seule de la fenêtre de capture PvP
// ---------------------------------------------------------------------------

function CaptureWindowRow({ label }: { label: string }) {
  return (
    <div style={{ padding: '0 11px 9px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'linear-gradient(to bottom, #fff7e6, #ecd9ab)',
        border: '1.5px solid #b08d5a',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 1px 0 rgba(0,0,0,.1)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 8.5, color: '#6d5838', letterSpacing: '.14em', textTransform: 'uppercase' }}>
          <ClockGlyph size={12} color="#9e7b0d"/> Fenêtre de capture
        </span>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#3d2f1f', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockedMsg
// ---------------------------------------------------------------------------

function BlockedMsg({ reason }: { reason: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: 600, fontSize: 9.5, color: '#7d1e15', textAlign: 'center', fontStyle: 'italic' }}>
      <img src={publicAsset('/assets/lock.png')} alt="" style={{ width: 10, height: 10 }}/> Attaque bloquée — {reason} (protection serveur)
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer({
  variant,
  attackBlocked,
  attackBlockedReason,
  onEnter,
  onSendResources,
  onReinforce,
  onScout,
  onAttack,
  onViewReport,
}: {
  variant: VillageMapVariant;
  attackBlocked?: boolean;
  attackBlockedReason?: string | null;
  onEnter?: () => void;
  onSendResources?: () => void;
  onReinforce?: () => void;
  onScout?: () => void;
  onAttack?: () => void;
  onViewReport?: () => void;
}) {
  if (variant === 'mine') {
    return (
      <div style={{ padding: '0 11px 11px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BftcButton variant="warning" size="md" disabled={!onEnter} className="w-full justify-center" onClick={onEnter}>
          <EnterGlyph size={15} color="#3a2a00"/> Entrer
        </BftcButton>
        <div style={{ display: 'flex', gap: 7 }}>
          <BftcButton variant="wood" size="sm" disabled={!onSendResources} className="w-full justify-center" onClick={onSendResources}>
            <ScrollGlyph size={14}/> Envoyer ressources
          </BftcButton>
          <BftcButton variant="info" size="sm" disabled={!onReinforce} className="w-full justify-center" onClick={onReinforce}>
            <ShieldGlyph size={14}/> Renfort
          </BftcButton>
        </div>
      </div>
    );
  }

  if (variant === 'scouted') {
    return (
      <div style={{ padding: '0 11px 11px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <BftcButton variant="info" size="md" className="w-full justify-center" onClick={onScout}>
            <img src={publicAsset('/assets/lupa.png')} alt="" style={{ width: 15, height: 15 }}/> Espionner
          </BftcButton>
          {attackBlocked
            ? <BftcButton variant="neutral" size="md" disabled aria-label="Attaquer" className="shrink-0 px-[13px]">
                <img src={publicAsset('/assets/lock.png')} alt="" style={{ width: 14, height: 14 }}/> <img src={publicAsset('/assets/attack.png')} alt="" style={{ width: 14, height: 14 }}/>
              </BftcButton>
            : <BftcButton variant="danger" size="md" className="w-full justify-center" onClick={onAttack}>
                <img src={publicAsset('/assets/attack.png')} alt="" style={{ width: 15, height: 15 }}/> Attaquer
              </BftcButton>
          }
          {onViewReport && (
            <BftcButton variant="wood" size="md" aria-label="Voir rapport source" className="shrink-0 px-[13px]" onClick={onViewReport}>
              <ScrollGlyph size={15}/>
            </BftcButton>
          )}
        </div>
        {attackBlocked && attackBlockedReason && <BlockedMsg reason={attackBlockedReason}/>}
      </div>
    );
  }

  // unscouted + barbare
  return (
    <div style={{ padding: '0 11px 11px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 7 }}>
        <BftcButton variant="info" size="md" className="w-full justify-center" onClick={onScout}>
          <img src={publicAsset('/assets/lupa.png')} alt="" style={{ width: 15, height: 15 }}/> Espionner
        </BftcButton>
        {attackBlocked
          ? <BftcButton variant="neutral" size="md" disabled className="w-full justify-center">
              <img src={publicAsset('/assets/lock.png')} alt="" style={{ width: 14, height: 14 }}/> Attaquer
            </BftcButton>
          : <BftcButton variant="danger" size="md" className="w-full justify-center" onClick={onAttack}>
              <img src={publicAsset('/assets/attack.png')} alt="" style={{ width: 15, height: 15 }}/> Attaquer
            </BftcButton>
        }
      </div>
      {attackBlocked && attackBlockedReason && <BlockedMsg reason={attackBlockedReason}/>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VillageMapPanel
// ---------------------------------------------------------------------------

export function VillageMapPanel({
  variant,
  name,
  coords,
  typeTag,
  owner,
  villagePower,
  ownerPower,
  intel,
  tier,
  captureWindowLabel,
  attackBlocked,
  attackBlockedReason,
  onClose,
  onEnter,
  onSendResources,
  onReinforce,
  onScout,
  onAttack,
  onViewReport,
  className,
}: VillageMapPanelProps) {
  const barbare = variant === 'barbare';

  return (
    <div className={cn('relative font-game', className)} style={{ width: 328, maxWidth: '92vw' }}>
      <div style={{
        position: 'relative',
        background: 'linear-gradient(to bottom, #fef9f0, #e8d4a8)',
        border: '4px solid #3c2619',
        borderRadius: 16,
        boxShadow: '0 0 0 2px #d4a017, 0 16px 34px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.55)',
        overflow: 'hidden',
      }}>
        {/* Bande dorée */}
        <div style={{ height: 7, background: 'linear-gradient(to right, #f1c40f, #d4a017)' }}/>

        {/* Tête */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 11px 8px' }}>
          <VillageTile size={42}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 900, fontSize: 16, color: '#3d2f1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>
                {name}
              </span>
              <CoordPill tone="light">{coords}</CoordPill>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <TypeTag kind={typeTag}/>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 10, color: '#6d5838', fontStyle: barbare ? 'italic' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {barbare ? '' : (owner ?? '')}
              </span>
            </div>
          </div>
          <CloseBtn onClick={onClose}/>
        </div>

        {/* Bande de puissance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px 9px' }}>
          {villagePower != null && <PowerCell label="Village" value={villagePower}/>}
          {!barbare && ownerPower != null && <PowerCell label="Joueur" value={ownerPower}/>}
        </div>

        {/* Fenêtre de capture (preview, village joueur ennemi) */}
        {captureWindowLabel && <CaptureWindowRow label={captureWindowLabel}/>}

        {/* Corps */}
        <div style={{ padding: '0 11px 10px' }}>
          {variant === 'unscouted' && <UnscoutedPanel/>}
          {barbare && tier != null && <TierPanel tier={tier}/>}
          {(variant === 'scouted' || variant === 'mine') && <FullIntelPanel {...(intel ?? {})}/>}
        </div>

        {/* Pied */}
        <Footer
          variant={variant}
          attackBlocked={attackBlocked}
          attackBlockedReason={attackBlockedReason}
          onEnter={onEnter}
          onSendResources={onSendResources}
          onReinforce={onReinforce}
          onScout={onScout}
          onAttack={onAttack}
          onViewReport={onViewReport}
        />
      </div>

      {/* Bec vers le nœud */}
      <div style={{ position: 'absolute', left: '50%', bottom: -13, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '13px solid transparent', borderTop: '14px solid #3c2619' }}/>
      <div style={{ position: 'absolute', left: '50%', bottom: -8, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '11px solid #e8d4a8' }}/>
    </div>
  );
}
