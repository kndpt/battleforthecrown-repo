export const GAME_SOUND_URLS = {
  notificationReceived: '/assets/sounds/notification-received.mp3',
  worldEntryComplete: '/assets/sounds/world-entry-complete.mp3',
} as const;

export function playGameSound(url: string, volume = 0.75): void {
  if (typeof window === 'undefined' || typeof window.Audio !== 'function') return;

  const audio = new window.Audio(url);
  audio.volume = volume;
  const playResult = audio.play();

  if (playResult && typeof playResult.catch === 'function') {
    playResult.catch(() => {
      // Browsers may block autoplay on reload before a user gesture.
    });
  }
}
