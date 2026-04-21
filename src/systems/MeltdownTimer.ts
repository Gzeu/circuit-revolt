import Phaser from 'phaser';

export class MeltdownTimer {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly border: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly warningText: Phaser.GameObjects.Text;
  private progress = 0;
  private warningPulse = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
  ) {
    this.background = this.scene.add.graphics();
    this.fill = this.scene.add.graphics();
    this.border = this.scene.add.graphics();
    this.glow = this.scene.add.graphics();
    
    this.warningText = this.scene.add.text(this.x + this.width / 2, this.y - 15, 'MELTDOWN PROGRESS', {
      fontFamily: "'Courier New', monospace",
      fontSize: '10px',
      color: '#4A5568',
      letterSpacing: 1,
    }).setOrigin(0.5, 0.5);
    
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
    const height = 12;
    
    // Background with gradient effect
    this.background.clear();
    this.background.fillStyle(0x1E2A3A, 1);
    this.background.fillRect(this.x, this.y, this.width, height);
    
    // Glow effect for high progress
    this.glow.clear();
    if (this.progress > 70) {
      const glowAlpha = (this.progress - 70) / 30 * 0.6;
      this.glow.fillStyle(0xFF3366, glowAlpha);
      this.glow.fillRect(this.x - 2, this.y - 2, this.width + 4, height + 4);
    }
    
    // Fill with color based on progress level
    this.fill.clear();
    let fillColor = 0x00f0e6; // Teal for low progress
    if (this.progress > 50) fillColor = 0xff9500; // Amber for medium
    if (this.progress > 80) fillColor = 0xff3366; // Red for high
    
    this.fill.fillStyle(fillColor, 1);
    this.fill.fillRect(this.x, this.y, this.width * (this.progress / 100), height);
    
    // Add inner glow line
    if (this.progress > 0) {
      this.fill.lineStyle(1, fillColor, 0.8);
      this.fill.strokeRect(this.x, this.y, this.width * (this.progress / 100), height);
    }
    
    // Enhanced border
    this.border.clear();
    this.border.lineStyle(2, 0x4A5568, 1);
    this.border.strokeRoundedRect(this.x, this.y, this.width, height, 2);
    
    // Update warning text
    this.warningPulse += 0.1;
    if (this.progress > 80) {
      const pulseAlpha = 0.5 + Math.sin(this.warningPulse) * 0.5;
      this.warningText.setColor('#ff3366');
      this.warningText.setAlpha(pulseAlpha);
      this.warningText.setText('⚠ MELTDOWN IMMINENT ⚠');
    } else if (this.progress > 50) {
      this.warningText.setColor('#ff9500');
      this.warningText.setAlpha(1);
      this.warningText.setText('MELTDOWN PROGRESS');
    } else {
      this.warningText.setColor('#4A5568');
      this.warningText.setAlpha(1);
      this.warningText.setText('MELTDOWN PROGRESS');
    }
  }
}
