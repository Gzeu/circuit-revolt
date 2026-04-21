import Phaser from 'phaser';

export class Preload extends Phaser.Scene {
  private static readonly C_BG = 0x0d0f14;
  private static readonly C_SURFACE = 0x1e2a3a;
  private static readonly C_TEAL = 0x00e5c8;

  private static readonly BAR_W = 400;
  private static readonly BAR_H = 6;
  private static readonly BAR_X = (960 - 400) / 2;
  private static readonly BAR_Y = 540 / 2 + 32;

  private barFill!: Phaser.GameObjects.Graphics;
  private labelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Preload' });
  }

  preload(): void {
    this.drawLoadingUI();
    this.bindProgressEvents();
    this.loadAssets();
  }

  create(): void {
    this.scene.start('MainMenu');
  }

  private drawLoadingUI(): void {
    const { width, height } = this.scale;
    const { BAR_X, BAR_Y, BAR_W, BAR_H, C_BG, C_SURFACE, C_TEAL } = Preload;

    const bg = this.add.graphics();
    bg.fillStyle(C_BG, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 24, 'CIRCUIT REVOLT', {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00E5C8',
      letterSpacing: 8,
    }).setOrigin(0.5);

    const track = this.add.graphics();
    track.fillStyle(C_SURFACE, 1);
    track.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

    this.barFill = this.add.graphics();

    const border = this.add.graphics();
    border.lineStyle(1, C_TEAL, 0.35);
    border.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H);

    this.labelText = this.add.text(BAR_X + BAR_W / 2, BAR_Y + 18, 'LOADING ASSETS  0%', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '11px',
      color: '#4A5568',
      letterSpacing: 3,
    }).setOrigin(0.5, 0);
  }

  private bindProgressEvents(): void {
    const { BAR_X, BAR_Y, BAR_W, BAR_H, C_TEAL } = Preload;

    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      this.barFill.clear();
      this.barFill.fillStyle(C_TEAL, 1);
      this.barFill.fillRect(BAR_X, BAR_Y, BAR_W * value, BAR_H);
      this.labelText.setText(`LOADING ASSETS  ${Math.round(value * 100)}%`);
    });

    this.load.on(Phaser.Loader.Events.COMPLETE, () => {
      this.labelText.setText('SYSTEMS ONLINE');
      this.labelText.setColor('#00E5C8');
    });

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[Preload] Failed to load: ${file.key} (${file.url})`);
    });
  }

  private loadAssets(): void {
    // Sprite sheets and audio loaded here as CDN URLs once assets exist.
    // Day 9: Howler.js handles audio via CDN, not Phaser loader.
  }
}
