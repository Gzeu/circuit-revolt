import Phaser from 'phaser';
import type { Point } from '../types';

export class CircuitPath {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private dot: Phaser.GameObjects.Arc | undefined;
  private color: number;
  private active = true;
  private tween?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly points: Point[],
    color: number,
  ) {
    this.color = color;
    this.graphics = this.scene.add.graphics();
  }

  draw(): void {
    this.graphics.clear();
    
    if (this.points.length < 4) {
      return;
    }

    // Draw glow effect
    this.graphics.lineStyle(6, this.color, 0.2);
    this.drawBezierCurve();
    
    // Draw main path
    this.graphics.lineStyle(2, this.color, this.active ? 0.8 : 0.4);
    this.drawBezierCurve();
    
    // Draw inner bright line
    this.graphics.lineStyle(1, this.color, 1);
    this.drawBezierCurve();
  }
  
  private drawBezierCurve(): void {
    const steps = 50;
    this.graphics.beginPath();
    this.graphics.moveTo(this.points[0].x, this.points[0].y);
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const point = this.evaluateBezier(t);
      this.graphics.lineTo(point.x, point.y);
    }
    
    this.graphics.strokePath();
  }

  pulse(durationMs: number, onComplete?: () => void): void {
    if (!this.active || this.points.length < 4) {
      return;
    }

    this.dot?.destroy();
    
    // Create enhanced pulse with glow
    const glow = this.scene.add.circle(this.points[0].x, this.points[0].y, 8, this.color, 0.3);
    this.dot = this.scene.add.circle(this.points[0].x, this.points[0].y, 4, this.color, 1);
    
    const progress = { t: 0, scale: 1, alpha: 1 };
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: durationMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!this.dot || !glow) return;
        const point = this.evaluateBezier(progress.t);
        this.dot.setPosition(point.x, point.y);
        glow.setPosition(point.x, point.y);
        
        // Pulsing effect
        const pulseScale = 1 + Math.sin(progress.t * Math.PI * 4) * 0.3;
        glow.setScale(pulseScale);
        glow.setAlpha(0.3 + Math.sin(progress.t * Math.PI * 4) * 0.2);
      },
      onComplete: () => {
        this.dot?.destroy();
        glow?.destroy();
        this.dot = undefined;
        onComplete?.();
      },
    });
  }

  setColor(color: number): void {
    this.color = color;
    this.draw();
    if (this.dot) {
      this.dot.setFillStyle(color, 1);
    }
  }

  deactivate(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.tween?.stop();

    const from = Phaser.Display.Color.IntegerToColor(this.color);
    const to = Phaser.Display.Color.IntegerToColor(0x4A5568);
    const mix = { t: 0 };

    this.scene.tweens.add({
      targets: mix,
      t: 1,
      duration: 800,
      onUpdate: () => {
        const interpolated = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, mix.t * 100);
        const nextColor = Phaser.Display.Color.GetColor(interpolated.r, interpolated.g, interpolated.b);
        this.color = nextColor;
        this.draw();
        if (this.dot) {
          this.dot.setFillStyle(nextColor, 1);
        }
      },
      onComplete: () => {
        this.color = 0x4A5568;
        this.draw();
        this.dot?.destroy();
        this.dot = undefined;
      },
    });
  }

  private evaluateBezier(t: number): Point {
    const p0 = this.points[0];
    const p1 = this.points[1];
    const p2 = this.points[2];
    const p3 = this.points[3];
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;

    return {
      x: (mt2 * mt * p0.x) + (3 * mt2 * t * p1.x) + (3 * mt * t2 * p2.x) + (t2 * t * p3.x),
      y: (mt2 * mt * p0.y) + (3 * mt2 * t * p1.y) + (3 * mt * t2 * p2.y) + (t2 * t * p3.y),
    };
  }
}
