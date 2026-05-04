import { Container, type Application } from 'pixi.js';

export interface PixiScene {
  /** Container appended to stage when active. */
  view: Container;
  /** Optional hook called when the scene becomes active. */
  enter?: (app: Application) => void;
  /** Optional cleanup called when the scene is replaced or the manager destroyed. */
  exit?: () => void;
  /** Optional per-frame tick. */
  update?: (deltaMs: number) => void;
}

type SceneFactory = (app: Application) => PixiScene;

export class SceneManager {
  private readonly factories = new Map<string, SceneFactory>();
  private current: { name: string; scene: PixiScene } | null = null;
  private tickerHandler: ((delta: { deltaMS: number }) => void) | null = null;
  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  register(name: string, factory: SceneFactory): void {
    this.factories.set(name, factory);
  }

  switchTo(name: string): void {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`SceneManager: unknown scene "${name}"`);
    }
    this.detachCurrent();

    const scene = factory(this.app);
    this.app.stage.addChild(scene.view);
    scene.enter?.(this.app);

    if (scene.update) {
      const handler = (delta: { deltaMS: number }) => scene.update?.(delta.deltaMS);
      this.app.ticker.add(handler);
      this.tickerHandler = handler;
    }

    this.current = { name, scene };
  }

  getCurrentName(): string | null {
    return this.current?.name ?? null;
  }

  destroy(): void {
    this.detachCurrent();
  }

  private detachCurrent(): void {
    if (!this.current) return;
    const { scene } = this.current;
    if (this.tickerHandler) {
      this.app.ticker.remove(this.tickerHandler);
      this.tickerHandler = null;
    }
    scene.exit?.();
    this.app.stage.removeChild(scene.view);
    scene.view.destroy({ children: true });
    this.current = null;
  }
}
