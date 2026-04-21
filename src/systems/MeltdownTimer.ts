import Phaser from 'phaser';

export class MeltdownTimer {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly border: Phaser.GameObjects.Graphics;
  private progress = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
  ) {
    this.background = this.scene.add.graphics();
    this.fill = this.scene.add.graphics();
    this.border = this.scene.add.graphics();
    this.draw();
  }

  update(delta: number, rate: number): void {
    this.progress = Phaser.Math.Clamp(this.progress + (rate * delta), 0, 100);
    this.draw();
  }

  reduce(amount: number): void {
    this.progress = Phaser.Math.Clamp(this.progress - amount, 0, 100);
    this.draw();
  }

  getProgress(): number {
    return this.progress;
  }

  isTriggered(): boolean {
    return this.progress >= 100;
  }

  private draw(): void {
    const height = 10;
    this.background.clear();
    this.background.fillStyle(0x1E2A3A, 1);
    this.background.fillRect(this.x, this.y, this.width, height);

    this.fill.clear();
    this.fill.fillStyle(0xFF4D6D, 1);
    this.fill.fillRect(this.x, this.y, this.width * (this.progress / 100), height);

    this.border.clear();
    this.border.lineStyle(1, 0x4A5568, 1);
    this.border.strokeRect(this.x, this.y, this.width, height);
  }
}
