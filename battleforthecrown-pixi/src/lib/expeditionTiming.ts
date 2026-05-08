// Visual timing for the expedition lifecycle. Shared by ws-bindings (which
// drives phase transitions) and ExpeditionVisual (which drives the FX) so the
// flash always finishes before troops turn back.

/** Duration of the victory/defeat flash on the target. */
export const BATTLE_FLASH_DURATION_MS = 600;

/** Delay between `battle.resolved` and the phase swap to RETURNING. Must
 *  outlive BATTLE_FLASH_DURATION_MS so the user sees the result first. */
export const RESOLVED_TO_RETURNING_DELAY_MS = 800;

/** Delay between `battle.returned` and snapshot removal so the unit visually
 *  reaches the origin village before disappearing. */
export const RETURNED_TO_CLEANUP_DELAY_MS = 600;
