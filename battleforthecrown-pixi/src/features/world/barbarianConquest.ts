// Preview de la fenêtre de capture barbare.
// Source de vérité unique (base, sans tempo) : `@battleforthecrown/shared/combat`
// (`docs/gameplay/13-barbarian-conquest.md` § Période de capture variable par tier).
// Le backend applique le tempo au runtime ; le preview affiche la durée de base,
// comme le preview PvP. API publique conservée pour `AttackDetailModal`.
export {
  BARBARIAN_CAPTURE_DURATIONS_MS,
  getBarbarianCaptureDurationMs,
  getBarbarianCaptureDurationLabel,
} from '@battleforthecrown/shared/combat';
