export interface ConstructionWindow {
  startTime: string | null;
  endTime: string | null;
}

export interface ConstructionProgress {
  inProgress: boolean;
  percent: number;
  remainingMs: number;
}

export function computeConstructionProgress(window: ConstructionWindow, nowMs: number): ConstructionProgress {
  if (!window.startTime || !window.endTime) {
    return { inProgress: false, percent: 0, remainingMs: 0 };
  }

  const start = Date.parse(window.startTime);
  const end = Date.parse(window.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { inProgress: false, percent: 0, remainingMs: 0 };
  }

  if (nowMs >= end) {
    return { inProgress: false, percent: 100, remainingMs: 0 };
  }
  if (nowMs <= start) {
    return { inProgress: true, percent: 0, remainingMs: end - start };
  }

  const total = end - start;
  const elapsed = nowMs - start;
  return {
    inProgress: true,
    percent: Math.min(100, Math.max(0, (elapsed / total) * 100)),
    remainingMs: end - nowMs,
  };
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return '0s';
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
