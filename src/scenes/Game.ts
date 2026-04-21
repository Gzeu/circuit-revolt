import Phaser from 'phaser';
import machinesData from '../data/machines.json';
import type { GameState, MachineDef, Point, SubsystemDef, SubsystemState } from '../types';
import { CircuitPath } from '../systems/CircuitPath';
import { MeltdownTimer } from '../systems/MeltdownTimer';
import { SubsystemLogic } from '../systems/SubsystemLogic';

export class Game extends Phaser.Scene {
  static readonly C_BG = 0x0d0f14;
  static readonly C_SURFACE = 0x1e2a3a;
  static readonly C_TEAL = 0x00e5c8;
  static readonly C_AMBER = 0xf5a623;
  static readonly C_GREY = 0x4a5568;
  static readonly C_FAULT = 0xff4d6d;

  private machine!: MachineDef;
  private gameState!: GameState;
  private meltdownTimer!: MeltdownTimer;
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE', Phaser.Input.Keyboard.Key>;
  private rulePanel!: Phaser.GameObjects.Text;
  private subsystemOrder: string[] = [];
  private subsystemLogic = new Map<string, SubsystemLogic>();
  private circuitPaths = new Map<string, CircuitPath>();
  private junctionZones = new Map<string, Phaser.GameObjects.Zone>();
  private subsystemLabels = new Map<string, Phaser.GameObjects.Text>();
  private activeJunctionId: string | null = null;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    this.machine = (machinesData as MachineDef[])[0];
    this.subsystemOrder = this.machine.subsystems.map(subsystem => subsystem.id);
    this.gameState = {
      subsystems: Object.fromEntries(this.machine.subsystems.map((subsystem, index) => [
        subsystem.id,
        {
          id: subsystem.id,
          status: index === 0 ? 'active' : 'overloaded',
          load: 84 - (index * 6),
          coolant: false,
          routedColor: subsystem.color,
        } satisfies SubsystemState,
      ])),
      meltdownProgress: 0,
      playerHits: 0,
    };

    this.drawBackground();
    this.drawMachineFrame();
    this.createSubsystems();
    this.meltdownTimer = new MeltdownTimer(this, 24, 24, 260);
    this.createPlayer();
    this.createRulePanel();
    this.createInputs();
  }

  update(_time: number, delta: number): void {
    this.handleMovement(delta);
    this.meltdownTimer.update(delta, 0.005);
    this.gameState.meltdownProgress = this.meltdownTimer.getProgress();
    this.updateOverlapState();

    if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE) && this.activeJunctionId) {
      this.tryRouteSubsystem(this.activeJunctionId);
    }

    if (this.meltdownTimer.isTriggered()) {
      this.scene.start('GameOver', { won: false });
    }
  }

  private drawBackground(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(Game.C_BG, 1);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, Game.C_SURFACE, 0.55);

    for (let x = 0; x <= width; x += 40) {
      bg.beginPath();
      bg.moveTo(x, 0);
      bg.lineTo(x, height);
      bg.strokePath();
    }

    for (let y = 0; y <= height; y += 40) {
      bg.beginPath();
      bg.moveTo(0, y);
      bg.lineTo(width, y);
      bg.strokePath();
    }
  }

  private drawMachineFrame(): void {
    const machineOrigin = { x: 280, y: 120 };
    const frame = this.add.graphics();
    frame.lineStyle(2, Game.C_SURFACE, 1);
    frame.strokeRoundedRect(machineOrigin.x, machineOrigin.y, 400, 300, 12);

    this.add.text(machineOrigin.x + 16, machineOrigin.y - 22, this.machine.name, {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '18px',
      color: '#00E5C8',
      letterSpacing: 2,
    });
  }

  private createSubsystems(): void {
    const machineOrigin = { x: 280, y: 120 };

    this.machine.subsystems.forEach((subsystem, index) => {
      this.subsystemLogic.set(subsystem.id, new SubsystemLogic(subsystem));

      const path = new CircuitPath(
        this,
        subsystem.pathPoints.map(point => ({
          x: machineOrigin.x + point.x,
          y: machineOrigin.y + point.y,
        })),
        Phaser.Display.Color.HexStringToColor(subsystem.color).color,
      );
      path.draw();
      path.pulse(subsystem.rule.interval, () => {
        if (this.gameState.subsystems[subsystem.id].status !== 'shutdown') {
          path.pulse(subsystem.rule.interval);
        }
      });
      this.circuitPaths.set(subsystem.id, path);

      const endPoint = subsystem.pathPoints[subsystem.pathPoints.length - 1];
      const zone = this.add.zone(machineOrigin.x + endPoint.x - 20, machineOrigin.y + endPoint.y - 20, 40, 40)
        .setOrigin(0, 0);
      this.junctionZones.set(subsystem.id, zone);

      const zoneBox = this.add.graphics();
      zoneBox.lineStyle(1, Game.C_GREY, 0.8);
      zoneBox.strokeRect(zone.x, zone.y, 40, 40);

      const label = this.add.text(zone.x - 6, zone.y - 18, `${index + 1}. ${subsystem.name}`, {
        fontFamily: "'Geist Mono', monospace",
        fontSize: '10px',
        color: '#4A5568',
        letterSpacing: 1,
      });
      this.subsystemLabels.set(subsystem.id, label);
    });
  }

  private createPlayer(): void {
    this.player = this.add.rectangle(480, 270, 18, 18, Game.C_TEAL, 1)
      .setStrokeStyle(1, Game.C_SURFACE, 1);
  }

  private createRulePanel(): void {
    this.rulePanel = this.add.text(24, 420, 'APPROACH A JUNCTION TO VIEW RULES', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '12px',
      color: '#4A5568',
      backgroundColor: '#0D0F14',
      padding: { x: 10, y: 8 },
      wordWrap: { width: 320 },
      lineSpacing: 6,
    }).setDepth(100);
  }

  private createInputs(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,SPACE') as Record<'W' | 'A' | 'S' | 'D' | 'SPACE', Phaser.Input.Keyboard.Key>;
  }

  private handleMovement(delta: number): void {
    const speed = 0.18 * delta;
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += speed;

    this.player.x = Phaser.Math.Clamp(this.player.x + dx, 10, this.scale.width - 10);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy, 10, this.scale.height - 10);
  }

  private updateOverlapState(): void {
    this.activeJunctionId = null;

    for (const [subsystemId, zone] of this.junctionZones.entries()) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), zone.getBounds())) {
        this.activeJunctionId = subsystemId;
        this.rulePanel.setText(this.describeSubsystem(subsystemId));
        this.rulePanel.setColor('#00E5C8');
        return;
      }
    }

    this.rulePanel.setText('APPROACH A JUNCTION TO VIEW RULES');
    this.rulePanel.setColor('#4A5568');
  }

  private describeSubsystem(subsystemId: string): string {
    const subsystem = this.machine.subsystems.find(item => item.id === subsystemId)!;
    const state = this.gameState.subsystems[subsystemId];
    const conditions = subsystem.rule.conditions
      .map(group => group.map(condition => `${condition.field} ${condition.operator} ${String(condition.value)}`).join(' AND '))
      .join(' OR ');

    return [
      `${subsystem.name}`,
      `if (${conditions}) => OVERLOADED`,
      `exit when ${subsystem.exitCondition.field} ${subsystem.exitCondition.operator} ${subsystem.exitCondition.value}`,
      `status: ${state.status} | load: ${state.load} | coolant: ${state.coolant ? 'ON' : 'OFF'}`,
      '',
      'PRESS SPACE TO ROUTE COOLANT',
    ].join('\n');
  }

  private tryRouteSubsystem(subsystemId: string): void {
    const subsystemIndex = this.subsystemOrder.indexOf(subsystemId);
    const previousId = subsystemIndex > 0 ? this.subsystemOrder[subsystemIndex - 1] : null;

    if (previousId && this.gameState.subsystems[previousId].status !== 'shutdown') {
      this.rulePanel.setText(`${this.describeSubsystem(subsystemId)}\n\nLOCKED: SHUT DOWN ${previousId.toUpperCase()} FIRST`);
      return;
    }

    const subsystem = this.machine.subsystems.find(item => item.id === subsystemId)!;
    const logic = this.subsystemLogic.get(subsystemId)!;
    const currentState = this.gameState.subsystems[subsystemId];
    const nextState = logic.applyRoute(currentState, subsystemId, '#00E5C8');
    const evaluatedStatus = logic.evaluate(nextState);
    const resolvedState: SubsystemState = {
      ...nextState,
      status: logic.isExitConditionMet(nextState) ? 'shutdown' : evaluatedStatus,
    };

    this.gameState.subsystems[subsystemId] = resolvedState;

    if (resolvedState.status === 'shutdown') {
      this.circuitPaths.get(subsystemId)?.deactivate();
      this.meltdownTimer.reduce(15);
      this.subsystemLabels.get(subsystemId)?.setColor('#00E5C8');
    } else {
      const nextColor = resolvedState.status === 'overloaded' ? Game.C_AMBER : Game.C_TEAL;
      this.circuitPaths.get(subsystemId)?.setColor(nextColor);
      this.circuitPaths.get(subsystemId)?.pulse(subsystem.rule.interval);
      this.subsystemLabels.get(subsystemId)?.setColor(resolvedState.status === 'overloaded' ? '#F5A623' : '#00E5C8');
    }

    this.rulePanel.setText(this.describeSubsystem(subsystemId));
  }
}
