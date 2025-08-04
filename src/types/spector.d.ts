// TypeScript declarations for spectorjs
declare module "spectorjs" {
  export class Spector {
    constructor();
    displayUI(): void;
    captureCanvas(
      canvas: HTMLCanvasElement,
      frames?: number,
      displayUI?: boolean
    ): void;
    dispose(): void;
  }
}

// TypeScript declarations for stats.js
declare module "stats.js" {
  export default class Stats {
    constructor();
    begin(): void;
    end(): void;
    showPanel(id: number): void;
    dom: HTMLElement;
  }
}
