export type CaravanResources = { wood: number; stone: number; iron: number };

export function subtractCaravanResources(
  left: CaravanResources,
  right: CaravanResources,
): CaravanResources {
  return {
    wood: Math.max(0, left.wood - right.wood),
    stone: Math.max(0, left.stone - right.stone),
    iron: Math.max(0, left.iron - right.iron),
  };
}
