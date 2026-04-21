import Phaser from 'phaser';
import { OptimismLeaderboard } from '../web3/OptimismLeaderboard';
import type { RunStats } from '../types';

interface GameOverData {
  won: boolean;
  floor: number;
  reason: string;
  stats: RunStats;
}

export class GameOver extends Phaser.Scene {
  private static readonly C_BG = 0x0d0f14;
  private static readonly C_SURFACE = 0x1e2a3a;
  private static readonly C_TEAL = 0x00e5c8;
  private static readonly C_FAULT = 0xff4d6d;

  private static readonly S_TEAL = '#00E5C8';
  private static readonly S_AMBER = '#F5A623';
  private static readonly S_GREY = '#4A5568';
  private static readonly S_FAULT = '#FF4D6D';

  private data_!: GameOverData;

  constructor() {
    super({ key: 'GameOver' });
  }

  init(data: GameOverData): void {
    this.data_ = data;
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.drawBackground(this.data_.won);

    const accent = this.data_.won ? GameOver.S_TEAL : GameOver.S_FAULT;
    const prefix = this.data_.won ? '// SYSTEM STABILIZED //' : '// SYSTEM FAULT //';
    const headline = this.data_.won ? 'DELTA-9 SECURE' : this.data_.reason;

    this.add.text(cx, 100, prefix, {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '12px',
      color: accent,
      letterSpacing: 5,
    }).setOrigin(0.5);

    this.add.text(cx, 150, headline, {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '32px',
      fontStyle: 'bold',
      color: accent,
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Stats grid
    const elapsed = this.data_.stats.elapsedMs;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const stats = [
      `FLOORS CLEARED   ${String(this.data_.stats.floorsCleared).padStart(2, '0')}`,
      `ROUTES EXECUTED ${String(this.data_.stats.routeActions).padStart(3, '0')}`,
      `HITS TAKEN      ${String(this.data_.stats.totalHits).padStart(2, '0')}`,
      `TIME            ${timeStr}`
    ];

    stats.forEach((line, index) => {
      this.add.text(cx, 220 + index * 22, line, {
        fontFamily: "'Geist Mono', monospace",
        fontSize: '12px',
        color: GameOver.S_GREY,
        letterSpacing: 3,
      }).setOrigin(0.5);
    });

    // Separator line
    const rule = this.add.graphics();
    rule.lineStyle(1, GameOver.C_TEAL, 0.3);
    rule.beginPath();
    rule.moveTo(cx - 200, 320);
    rule.lineTo(cx + 200, 320);
    rule.strokePath();

    let buttonY = 360;
    
    if (this.data_.won) {
      this.makeButton(cx, buttonY, '[ SUBMIT SCORE ]', () => this.submitScore(), GameOver.S_TEAL);
      buttonY += 44;
    }

    this.makeButton(cx, buttonY, '[ PLAY AGAIN ]', () => this.scene.start('Game'), GameOver.S_TEAL);
    buttonY += 44;
    this.makeButton(cx, buttonY, '[ MAIN MENU ]', () => this.scene.start('MainMenu'), GameOver.S_GREY);

    // Keyboard shortcuts
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-R', () => this.scene.start('Game'));
      this.input.keyboard.on('keydown-M', () => this.scene.start('MainMenu'));
      if (this.data_.won) {
        this.input.keyboard.on('keydown-S', () => this.submitScore());
      }
    }
  }

  private drawBackground(won: boolean): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(GameOver.C_BG, 1);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, GameOver.C_SURFACE, 0.4);
    const step = 40;
    for (let x = 0; x <= width; x += step) {
      bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, height); bg.strokePath();
    }
    for (let y = 0; y <= height; y += step) {
      bg.beginPath(); bg.moveTo(0, y); bg.lineTo(width, y); bg.strokePath();
    }
    bg.fillStyle(won ? GameOver.C_TEAL : GameOver.C_FAULT, won ? 0.03 : 0.03);
    bg.fillRect(0, 0, width, height);
  }

  private async submitScore(): Promise<void> {
    const submitBtn = this.children.getAt(this.children.length - 3) as Phaser.GameObjects.Text;
    if (submitBtn) {
      submitBtn.setText('[ SUBMITTING... ]');
      submitBtn.setColor(GameOver.S_AMBER);
    }

    try {
      const txHash = await OptimismLeaderboard.submitScore(
        this.data_.stats.floorsCleared,
        this.data_.stats.elapsedMs
      );

      if (submitBtn) {
        if (txHash) {
          submitBtn.setText('[ SCORE SUBMITTED ]');
          submitBtn.setColor(GameOver.S_TEAL);
        } else {
          submitBtn.setText('[ SUBMIT FAILED ]');
          submitBtn.setColor(GameOver.S_FAULT);
          this.time.delayedCall(2000, () => {
            submitBtn.setText('[ SUBMIT SCORE ]');
            submitBtn.setColor(GameOver.S_TEAL);
          });
        }
      }
    } catch {
      if (submitBtn) {
        submitBtn.setText('[ SUBMIT FAILED ]');
        submitBtn.setColor(GameOver.S_FAULT);
        this.time.delayedCall(2000, () => {
          submitBtn.setText('[ SUBMIT SCORE ]');
          submitBtn.setColor(GameOver.S_TEAL);
        });
      }
    }
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, color: string): void {
    const txt = this.add.text(x, y, label, {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '13px',
      color,
      letterSpacing: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    txt.on('pointerover', () => txt.setColor('#FFFFFF'));
    txt.on('pointerout', () => txt.setColor(color));
    txt.on('pointerdown', () => txt.setColor(GameOver.S_AMBER));
    txt.on('pointerup', () => {
      txt.setColor(color);
      onClick();
    });
  }
}
