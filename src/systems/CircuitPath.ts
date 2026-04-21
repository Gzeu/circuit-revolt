import Phaser from 'phaser';
import type { Point } from '../types';

export class CircuitPath {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private dot: Phaser.GameObjects.Arc | undefined;
  private color: number;
  private active = true;
  private tween?: Phaser.Tweens.Tween;
  private sparkles: Phaser.GameObjects.Graphics[] = [];
  private glowIntensity = 0;

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

    // Enhanced glow effect with pulsing
    const glowAlpha = this.active ? 0.3 + this.glowIntensity * 0.2 : 0.1;
    this.graphics.lineStyle(8, this.color, glowAlpha);
    this.drawBezierCurve();
    
    // Draw main path with enhanced brightness
    const mainAlpha = this.active ? 0.9 : 0.4;
    this.graphics.lineStyle(3, this.color, mainAlpha);
    this.drawBezierCurve();
    
    // Draw inner bright line
    this.graphics.lineStyle(1, this.color, 1);
    this.drawBezierCurve();
    
    // Add sparkle effects along the path
    if (this.active) {
      this.createSparkles();
    }
  }
  
  private createSparkles(): void {
    // Clear existing sparkles
    this.sparkles.forEach(sparkle => sparkle.destroy());
    this.sparkles = [];
    
    // Create new sparkles along the path
    const sparkleCount = 5;
    for (let i = 0; i < sparkleCount; i++) {
      const t = (i + 1) / (sparkleCount + 1);
      const point = this.evaluateBezier(t);
      
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(this.color, 0.6);
      sparkle.fillCircle(point.x, point.y, 1);
      
      // Animate sparkle
      const sparkleData = { scale: 1, alpha: 0.6 };
      this.scene.tweens.add({
        targets: sparkleData,
        scale: 1.5,
        alpha: 0,
        duration: 1000 + i * 200,
        repeat: -1,
        delay: i * 200,
        onUpdate: () => {
          sparkle.clear();
          sparkle.fillStyle(this.color, sparkleData.alpha);
          sparkle.fillCircle(point.x, point.y, sparkleData.scale);
        }
      });
      
      this.sparkles.push(sparkle);
    }
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
    
    // Create enhanced pulse with multiple glow layers
    const outerGlow = this.scene.add.circle(this.points[0].x, this.points[0].y, 12, this.color, 0.2);
    const innerGlow = this.scene.add.circle(this.points[0].x, this.points[0].y, 8, this.color, 0.4);
    this.dot = this.scene.add.circle(this.points[0].x, this.points[0].y, 4, this.color, 1);
    
    // Create trail effect
    const trail = this.scene.add.graphics();
    const trailPoints: {x: number, y: number, alpha: number}[] = [];
    
    const progress = { t: 0, scale: 1, alpha: 1 };
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: durationMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!this.dot || !outerGlow || !innerGlow) return;
        const point = this.evaluateBezier(progress.t);
        this.dot.setPosition(point.x, point.y);
        outerGlow.setPosition(point.x, point.y);
        innerGlow.setPosition(point.x, point.y);
        
        // Enhanced pulsing effect
        const pulseScale = 1 + Math.sin(progress.t * Math.PI * 6) * 0.4;
        const pulseAlpha = 0.3 + Math.sin(progress.t * Math.PI * 6) * 0.3;
        outerGlow.setScale(pulseScale * 1.5);
        outerGlow.setAlpha(pulseAlpha * 0.5);
        innerGlow.setScale(pulseScale);
        innerGlow.setAlpha(pulseAlpha);
        
        // Update glow intensity for path
        this.glowIntensity = pulseAlpha;
        this.draw();
        
        // Add trail point
        if (progress.t > 0.1) {
          trailPoints.push({ x: point.x, y: point.y, alpha: 0.5 });
          if (trailPoints.length > 10) trailPoints.shift();
          
          // Draw trail
          trail.clear();
          trailPoints.forEach((tp, index) => {
            const trailAlpha = tp.alpha * (index / trailPoints.length) * 0.3;
            trail.fillStyle(this.color, trailAlpha);
            trail.fillCircle(tp.x, tp.y, 2);
          });
        }
      },
      onComplete: () => {
        this.dot?.destroy();
        outerGlow?.destroy();
        innerGlow?.destroy();
        trail?.destroy();
        this.dot = undefined;
        this.glowIntensity = 0;
        this.draw();
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
