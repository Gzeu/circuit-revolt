import Phaser from 'phaser';
import machinesData from '../data/machines.json';

interface SubsystemRule {
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | string | boolean;
}

interface Subsystem {
  id: string;
  name: string;
  rule: SubsystemRule[];
  exitCondition: string;
  pathPoints: [number, number][];
  color: string;
  active: boolean;
  shutdown: boolean;
}

interface MachineDefinition {
  id: string;
  name: string;
  floor: number;
  subsystems: Subsystem[];
}

interface GameState {
  floor: number;
  lives: number;
  meltdownPct: number;
  machines: MachineDefinition[];
  walletAddress: string | null;
  runStartTime: number;
}

export class Game extends Phaser.Scene {
  static readonly C_BG = 0x0d0f14;
  static readonly C_SURFACE = 0x1e2a3a;
  static readonly C_TEAL = 0x00e5c8;
  static readonly C_AMBER = 0xf5a623;
  static readonly C_GREY = 0x4a5568;
  static readonly C_FAULT = 0xff4d6d;

  private state!: GameState;
  private meltdownFill!: Phaser.GameObjects.Graphics;
  private livesText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Game' });
  }

  init(): void {
    this.state = {
      floor: 1,
      lives: 3,
      meltdownPct: 0,
      machines: this.hydrateRuntimeState(machinesData as MachineDefinition[]),
      walletAddress: null,
      runStartTime: Date.now(),
    };
  }

  create(): void {
    this.drawBackground();
    this.buildHUD();

    this.debugText = this.add.text(16, 16, '', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '10px',
      color: '#4A5568',
      letterSpacing: 1,
    }).setDepth(100);

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        this.scene.start('MainMenu');
      });
    }
  }

  update(_time: number, delta: number): void {
    this.tickMeltdown(delta);
    this.updateHUD();
    this.checkGameOver();

    if (import.meta.env.DEV) {
      this.debugText.setText([
        `FLOOR ${this.state.floor}  LIVES ${this.state.lives}`,
        `MELTDOWN ${this.state.meltdownPct.toFixed(1)}%`,
        `MACHINES ${this.state.machines.length}`,
      ]);
    }
  }

  private drawBackground(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(Game.C_BG, 1);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, Game.C_SURFACE, 0.6);
    const step = 40;
    for (let x = 0; x <= width; x += step) {
      bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, height); bg.strokePath();
    }
    for (let y = 0; y <= height; y += step) {
      bg.beginPath(); bg.moveTo(0, y); bg.lineTo(width, y); bg.strokePath();
    }
  }

  private buildHUD(): void {
    const { width } = this.scale;

    const track = this.add.graphics();
    track.fillStyle(Game.C_SURFACE, 1);
    track.fillRect(0, 0, width, 6);
    track.setDepth(50);

    this.meltdownFill = this.add.graphics();
    this.meltdownFill.setDepth(51);

    this.add.text(8, 10, 'MELTDOWN', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '9px',
      color: '#FF4D6D',
      letterSpacing: 3,
    }).setDepth(52);

    this.livesText = this.add.text(width - 12, 10, '', {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '11px',
      color: '#00E5C8',
      letterSpacing: 2,
    }).setOrigin(1, 0).setDepth(52);

    this.floorText = this.add.text(width / 2, 10, '', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '10px',
      color: '#4A5568',
      letterSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(52);
  }

  private updateHUD(): void {
    const { width } = this.scale;
    const pct = this.state.meltdownPct / 100;

    let color = Game.C_TEAL;
    if (pct >= 0.75) color = Game.C_FAULT;
    else if (pct >= 0.5) color = Game.C_AMBER;

    this.meltdownFill.clear();
    this.meltdownFill.fillStyle(color, 1);
    this.meltdownFill.fillRect(0, 0, width * pct, 6);

    const dots = Array.from({ length: 3 }, (_, i) => i < this.state.lives ? '●' : '○').join(' ');
    this.livesText.setText(`SYS ${dots}`);
    this.floorText.setText(`FLOOR ${String(this.state.floor).padStart(2, '0')}`);
  }

  private tickMeltdown(delta: number): void {
    if (this.state.meltdownPct >= 100) return;
    this.state.meltdownPct = Math.min(100, this.state.meltdownPct + delta * 0.00020);
  }

  private checkGameOver(): void {
    if (this.state.meltdownPct >= 100 || this.state.lives <= 0) {
      this.scene.start('GameOver', {
        floor: this.state.floor,
        reason: this.state.meltdownPct >= 100 ? 'MELTDOWN' : 'CRITICAL_DAMAGE',
        elapsed: Date.now() - this.state.runStartTime,
      });
    }
  }

  private hydrateRuntimeState(raw: MachineDefinition[]): MachineDefinition[] {
    return raw.map(machine => ({
      ...machine,
      subsystems: machine.subsystems.map(sub => ({
        ...sub,
        active: true,
        shutdown: false,
      })),
    }));
  }
}
