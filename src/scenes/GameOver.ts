import Phaser from 'phaser';

interface GameOverData {
  floor: number;
  reason: 'MELTDOWN' | 'CRITICAL_DAMAGE';
  elapsed: number;
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
    this.data_ = {
      floor: data.floor ?? 1,
      reason: data.reason ?? 'MELTDOWN',
      elapsed: data.elapsed ?? 0,
    };
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.drawBackground();

    const faultColor = this.data_.reason === 'MELTDOWN' ? GameOver.S_FAULT : GameOver.S_AMBER;

    this.add.text(cx, 130, '// SYSTEM FAULT //', {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '11px',
      color: faultColor,
      letterSpacing: 5,
    }).setOrigin(0.5);

    const errorCode = this.data_.reason === 'MELTDOWN'
      ? 'ERR::CORE_MELTDOWN'
      : 'ERR::CRITICAL_DAMAGE';

    this.add.text(cx, 186, errorCode, {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '28px',
      fontStyle: 'bold',
      color: faultColor,
      letterSpacing: 4,
    }).setOrigin(0.5);

    const elapsed = this.data_.elapsed;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    [
      `FLOOR REACHED    ${String(this.data_.floor).padStart(2, '0')}`,
      `TIME ELAPSED     ${timeStr}`,
    ].forEach((line, i) => {
      this.add.text(cx, 258 + i * 24, line, {
        fontFamily: "'Geist Mono', monospace",
        fontSize: '12px',
        color: GameOver.S_GREY,
        letterSpacing: 3,
      }).setOrigin(0.5);
    });

    const rule = this.add.graphics();
    rule.lineStyle(1, GameOver.C_TEAL, 0.2);
    rule.beginPath();
    rule.moveTo(cx - 180, 318);
    rule.lineTo(cx + 180, 318);
    rule.strokePath();

    this.makeButton(cx, 358, '[ REBOOT SYSTEM ]', () => this.scene.start('Game'), GameOver.S_TEAL);
    this.makeButton(cx, 404, '[ RETURN TO MENU ]', () => this.scene.start('MainMenu'), GameOver.S_GREY);

    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-R', () => this.scene.start('Game'));
      this.input.keyboard.once('keydown-M', () => this.scene.start('MainMenu'));
    }
  }

  private drawBackground(): void {
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
    bg.fillStyle(GameOver.C_FAULT, 0.03);
    bg.fillRect(0, 0, width, height);
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
