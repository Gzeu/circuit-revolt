import Phaser from 'phaser';
import machinesData from '../data/machines.json';
import type { GameState, MachineDef, SubsystemState } from '../types';
import { CircuitPath } from '../systems/CircuitPath';
import { MeltdownTimer } from '../systems/MeltdownTimer';
import { SubsystemLogic } from '../systems/SubsystemLogic';

export class Game extends Phaser.Scene {
  static readonly C_BG = 0x0a0c10;
  static readonly C_SURFACE = 0x1a2332;
  static readonly C_TEAL = 0x00f0e6;
  static readonly C_AMBER = 0xff9500;
  static readonly C_GREY = 0x3a4556;
  static readonly C_FAULT = 0xff3366;
  static readonly C_GLOW = 0x00ffff;
  static readonly C_WARNING = 0xffaa00;

  private machine!: MachineDef;
  private gameState!: GameState;
  private meltdownTimer!: MeltdownTimer;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private playerGlow!: Phaser.GameObjects.Arc;
  private playerTrail!: Phaser.GameObjects.Graphics;
  private particles!: Phaser.GameObjects.Graphics;
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
    
    // Gradient background
    bg.fillStyle(Game.C_BG, 1);
    bg.fillRect(0, 0, width, height);
    
    // Add subtle gradient overlay using rectangles
    const gradientSteps = 20;
    for (let i = 0; i <= gradientSteps; i++) {
      const t = i / gradientSteps;
      const alpha = 0.1 * (1 - t) + 0.05 * t;
      const y = (height / gradientSteps) * i;
      const h = height / gradientSteps;
      bg.fillStyle(Game.C_SURFACE, alpha);
      bg.fillRect(0, y, width, h);
    }
    
    // Enhanced grid with glow effect
    bg.lineStyle(1, Game.C_SURFACE, 0.3);
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
    
    // Add corner accents
    bg.fillStyle(Game.C_TEAL, 0.05);
    bg.fillCircle(50, 50, 30);
    bg.fillCircle(width - 50, 50, 30);
    bg.fillCircle(50, height - 50, 30);
    bg.fillCircle(width - 50, height - 50, 30);
  }

  private drawMachineFrame(): void {
    const machineOrigin = { x: 280, y: 120 };
    const frame = this.add.graphics();
    
    // Machine background with gradient
    frame.fillStyle(Game.C_SURFACE, 0.2);
    frame.fillRoundedRect(machineOrigin.x, machineOrigin.y, 400, 300, 12);
    
    // Enhanced frame with glow
    frame.lineStyle(3, Game.C_TEAL, 0.8);
    frame.strokeRoundedRect(machineOrigin.x, machineOrigin.y, 400, 300, 12);
    frame.lineStyle(1, Game.C_SURFACE, 1);
    frame.strokeRoundedRect(machineOrigin.x + 2, machineOrigin.y + 2, 396, 296, 10);
    
    // Enhanced title with glow effect
    this.add.text(machineOrigin.x + 16, machineOrigin.y - 22, this.machine.name, {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '18px',
      color: '#00f0e6',
      letterSpacing: 2,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#00f0e6',
        blur: 8,
        stroke: true,
        fill: true
      }
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
        fontFamily: "'Courier New', monospace",
        fontSize: '10px',
        color: '#4A5568',
        letterSpacing: 1,
      });
      this.subsystemLabels.set(subsystem.id, label);
    });
  }

  private createPlayer(): void {
    // Create particle system
    this.particles = this.add.graphics();
    this.createAmbientParticles();
    
    // Create player container for enhanced visuals
    this.player = this.add.container(480, 270);
    
    // Player trail effect
    this.playerTrail = this.add.graphics();
    this.player.add(this.playerTrail);
    
    // Player glow effect
    this.playerGlow = this.add.circle(0, 0, 12, Game.C_GLOW, 0.3);
    this.player.add(this.playerGlow);
    
    // Main player sprite
    this.playerSprite = this.add.rectangle(0, 0, 16, 16, Game.C_TEAL, 1)
      .setStrokeStyle(2, Game.C_SURFACE, 1);
    this.player.add(this.playerSprite);
    
    // Add pulsing animation to glow
    this.tweens.add({
      targets: this.playerGlow,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add rotation animation to player sprite
    this.tweens.add({
      targets: this.playerSprite,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });
  }
  
  private createAmbientParticles(): void {
    // Create floating particles in the background
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.scale.width;
      const y = Math.random() * this.scale.height;
      const size = 1 + Math.random() * 2;
      const alpha = 0.1 + Math.random() * 0.3;
      
      this.tweens.add({
        targets: { x, y, alpha },
        x: x + (Math.random() - 0.5) * 100,
        y: y - 50,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000,
        onUpdate: () => {
          this.particles.fillStyle(Game.C_TEAL, alpha);
          this.particles.fillCircle(x, y, size);
        }
      });
    }
  }

  private createRulePanel(): void {
    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(Game.C_BG, 0.95);
    panelBg.fillRoundedRect(20, 418, 340, 100, 8);
    panelBg.lineStyle(1, Game.C_TEAL, 0.6);
    panelBg.strokeRoundedRect(20, 418, 340, 100, 8);
    panelBg.setDepth(99);
    
    this.rulePanel = this.add.text(30, 428, 'APPROACH A JUNCTION TO VIEW RULES', {
      fontFamily: "'Courier New', monospace",
      fontSize: '12px',
      color: '#4A5568',
      backgroundColor: 'transparent',
      padding: { x: 10, y: 8 },
      wordWrap: { width: 320 },
      lineSpacing: 6,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#00f0e6',
        blur: 2,
        stroke: false,
        fill: false
      }
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

    const oldX = this.player.x;
    const oldY = this.player.y;
    
    this.player.x = Phaser.Math.Clamp(this.player.x + dx, 10, this.scale.width - 10);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy, 10, this.scale.height - 10);
    
    // Create trail effect when moving
    if (dx !== 0 || dy !== 0) {
      this.createTrailEffect(oldX, oldY);
    }
  }
  
  private createTrailEffect(x: number, y: number): void {
    this.playerTrail.clear();
    this.playerTrail.fillStyle(Game.C_TEAL, 0.3);
    this.playerTrail.fillCircle(x - this.player.x, y - this.player.y, 8);
    
    // Fade out trail
    const trailData = { alpha: 0.3 };
    this.tweens.add({
      targets: trailData,
      alpha: 0,
      duration: 500,
      onUpdate: () => {
        this.playerTrail.clear();
        this.playerTrail.fillStyle(Game.C_TEAL, trailData.alpha);
        this.playerTrail.fillCircle(x - this.player.x, y - this.player.y, 8);
      },
      onComplete: () => {
        this.playerTrail.clear();
      }
    });
  }

  private updateOverlapState(): void {
    this.activeJunctionId = null;

    for (const [subsystemId, zone] of this.junctionZones.entries()) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), zone.getBounds())) {
        this.activeJunctionId = subsystemId;
        this.rulePanel.setText(this.describeSubsystem(subsystemId));
        this.rulePanel.setColor('#00f0e6');
        
        // Highlight active junction
        this.highlightJunction(subsystemId);
        return;
      }
    }

    this.rulePanel.setText('APPROACH A JUNCTION TO VIEW RULES');
    this.rulePanel.setColor('#4A5568');
  }
  
  private highlightJunction(subsystemId: string): void {
    const zone = this.junctionZones.get(subsystemId);
    if (!zone) return;
    
    // Create highlight effect
    const highlight = this.add.graphics();
    highlight.lineStyle(2, Game.C_GLOW, 0.8);
    highlight.strokeRect(zone.x - 2, zone.y - 2, 44, 44);
    
    // Pulsing animation
    this.tweens.add({
      targets: highlight,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        highlight.destroy();
      }
    });
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
