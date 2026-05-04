import { Application, type ApplicationOptions } from 'pixi.js';

export type CreatePixiAppOptions = Partial<ApplicationOptions> & {
  /** Element the canvas will be appended to. */
  container: HTMLElement;
};

export async function createPixiApp({ container, ...options }: CreatePixiAppOptions): Promise<Application> {
  const app = new Application();
  await app.init({
    resizeTo: container,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    backgroundAlpha: 0,
    preference: 'webgl',
    ...options,
  });
  container.appendChild(app.canvas);
  if (import.meta.env.DEV) {
    (globalThis as { __pixiApp?: Application }).__pixiApp = app;
  }
  return app;
}
