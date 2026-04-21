import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
  private static readonly PALETTE: Record<string, string> = {
    '--color-bg': '#0D0F14',
    '--color-surface': '#1E2A3A',
    '--color-teal': '#00E5C8',
    '--color-amber': '#F5A623',
    '--color-grey': '#4A5568',
    '--color-fault': '#FF4D6D',
  };

  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    this.applyPaletteToDOM();
    this.scene.start('Preload');
  }

  private applyPaletteToDOM(): void {
    const root = document.documentElement;
    for (const [variable, value] of Object.entries(Boot.PALETTE)) {
      root.style.setProperty(variable, value);
    }
    root.style.setProperty('--font-display', "'Azeret Mono', 'Courier New', monospace");
    root.style.setProperty('--font-body', "'Geist Mono', 'Courier New', monospace");
  }
}
