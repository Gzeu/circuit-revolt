import Phaser from 'phaser';

type BrowserProvider = import('ethers').BrowserProvider;

interface WalletState {
  connected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
}

export class MainMenu extends Phaser.Scene {
  private static readonly C_BG = 0x0d0f14;
  private static readonly C_SURFACE = 0x1e2a3a;
  private static readonly C_TEAL = 0x00e5c8;
  private static readonly C_AMBER = 0xf5a623;
  private static readonly C_GREY = 0x4a5568;

  private static readonly S_TEAL = '#00E5C8';
  private static readonly S_AMBER = '#F5A623';
  private static readonly S_GREY = '#4A5568';
  private static readonly S_WHITE = '#FFFFFF';

  private wallet: WalletState = {
    connected: false,
    address: null,
    provider: null,
  };

  private walletBtn!: Phaser.GameObjects.Text;
  private walletLabel!: Phaser.GameObjects.Text;
  private howToPlayBtn!: Phaser.GameObjects.Text;
  private howToPlayOverlay!: Phaser.GameObjects.Container;
  private howToPlayVisible = false;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.drawBackground();
    this.drawDecorativeCircuits();

    this.add.text(cx, 148, 'CIRCUIT REVOLT', {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '42px',
      fontStyle: 'bold',
      color: MainMenu.S_TEAL,
      letterSpacing: 6,
    }).setOrigin(0.5);

    this.add.text(cx, 205, 'MAINTENANCE AI ONLINE', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '13px',
      color: MainMenu.S_GREY,
      letterSpacing: 5,
    }).setOrigin(0.5);

    const rule = this.add.graphics();
    rule.lineStyle(1, MainMenu.C_TEAL, 0.2);
    rule.beginPath();
    rule.moveTo(cx - 200, 228);
    rule.lineTo(cx + 200, 228);
    rule.strokePath();

    this.add.text(cx, 242, 'GAMEDEV.JS JAM 2026 · THEME: MACHINES', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '9px',
      color: '#2A4A5A',
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.makeButton(cx, 316, '[ START SYSTEM ]', 16, MainMenu.S_TEAL, () => {
      this.scene.start('Game');
    });

    this.walletBtn = this.makeButton(
      cx,
      370,
      '[ CONNECT WALLET ]',
      11,
      MainMenu.S_GREY,
      () => void this.onConnectWalletClick(),
      true,
    );

    this.walletLabel = this.add.text(cx, 398, '', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '10px',
      color: MainMenu.S_AMBER,
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.howToPlayBtn = this.makeButton(
      cx,
      425,
      '[ HOW TO PLAY ]',
      11,
      MainMenu.S_GREY,
      () => this.toggleHowToPlay(),
      true
    );

    this.add.text(cx, height - 20, 'MIT LICENSE · OPEN SOURCE · GITHUB.COM/GZEU/CIRCUIT-REVOLT', {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '8px',
      color: '#1A2A38',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.createHowToPlayOverlay();
    this.startScanlineEffect();

    // ESC key handler
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.howToPlayVisible) {
        this.hideHowToPlay();
      }
    });
  }

  private drawBackground(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(MainMenu.C_BG, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, MainMenu.C_SURFACE, 1);
    const step = 40;
    for (let x = 0; x <= width; x += step) {
      bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, height); bg.strokePath();
    }
    for (let y = 0; y <= height; y += step) {
      bg.beginPath(); bg.moveTo(0, y); bg.lineTo(width, y); bg.strokePath();
    }

    const accent = this.add.graphics();
    accent.lineStyle(1, MainMenu.C_TEAL, 0.6);
    accent.beginPath(); accent.moveTo(40, 20); accent.lineTo(20, 20); accent.lineTo(20, 40); accent.strokePath();
    accent.beginPath(); accent.moveTo(width - 40, 20); accent.lineTo(width - 20, 20); accent.lineTo(width - 20, 40); accent.strokePath();
    accent.beginPath(); accent.moveTo(40, height - 20); accent.lineTo(20, height - 20); accent.lineTo(20, height - 40); accent.strokePath();
    accent.beginPath(); accent.moveTo(width - 40, height - 20); accent.lineTo(width - 20, height - 20); accent.lineTo(width - 20, height - 40); accent.strokePath();
  }

  private drawDecorativeCircuits(): void {
    const g = this.add.graphics();
    g.lineStyle(1, MainMenu.C_TEAL, 0.08);
    g.beginPath(); g.moveTo(0, 420); g.lineTo(200, 420); g.lineTo(200, 400); g.lineTo(280, 400); g.strokePath();
    g.fillStyle(MainMenu.C_TEAL, 0.15);
    g.fillCircle(200, 420, 3);
    g.fillCircle(280, 400, 3);

    g.lineStyle(1, MainMenu.C_TEAL, 0.06);
    g.beginPath(); g.moveTo(960, 380); g.lineTo(760, 380); g.lineTo(760, 360); g.lineTo(680, 360); g.strokePath();
    g.fillStyle(MainMenu.C_TEAL, 0.1);
    g.fillCircle(760, 380, 3);
    g.fillCircle(680, 360, 3);
  }

  private startScanlineEffect(): void {
    const { width } = this.scale;
    const line = this.add.graphics();
    let y = 0;
    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        line.clear();
        line.fillStyle(MainMenu.C_TEAL, 0.04);
        line.fillRect(0, y, width, 2);
        y = (y + 2) % 540;
      },
    });
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    fontSize: number,
    color: string,
    onClick: () => void,
    isSecondary = false,
  ): Phaser.GameObjects.Text {
    const txt = this.add.text(x, y, label, {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: `${fontSize}px`,
      color,
      letterSpacing: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    if (!isSecondary) {
      const pad = 14;
      const bounds = txt.getBounds();
      const box = this.add.graphics();
      box.lineStyle(1, MainMenu.C_TEAL, 0.4);
      box.strokeRect(bounds.x - pad, bounds.y - pad / 2, bounds.width + pad * 2, bounds.height + pad);
    }

    txt.on('pointerover', () => txt.setColor(isSecondary ? MainMenu.S_WHITE : MainMenu.S_AMBER));
    txt.on('pointerout', () => txt.setColor(color));
    txt.on('pointerdown', () => txt.setColor(MainMenu.S_TEAL));
    txt.on('pointerup', () => {
      txt.setColor(color);
      onClick();
    });

    return txt;
  }

  private async onConnectWalletClick(): Promise<void> {
    if (this.wallet.connected) {
      this.showWalletAddress(this.wallet.address ?? '');
      return;
    }

    this.walletBtn.setText('[ CONNECTING... ]');
    this.walletBtn.setColor(MainMenu.S_AMBER);

    try {
      const { BrowserProvider } = await import('ethers');
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('No EIP-1193 provider found');

      const provider = new BrowserProvider(ethereum);
      const accounts: string[] = await provider.send('eth_requestAccounts', []);
      if (!accounts[0]) throw new Error('No accounts returned');

      this.wallet = { connected: true, address: accounts[0], provider };
      this.walletBtn.setText('[ WALLET LINKED ]');
      this.walletBtn.setColor(MainMenu.S_TEAL);
      this.showWalletAddress(accounts[0]);
    } catch (err) {
      console.info('[MainMenu] Wallet connect skipped:', err);
      this.walletBtn.setText('[ CONNECT WALLET ]');
      this.walletBtn.setColor(MainMenu.S_GREY);
      this.walletLabel.setText('WALLET UNAVAILABLE — GAME CONTINUES');
      this.walletLabel.setColor(MainMenu.S_GREY);
      this.time.delayedCall(3000, () => this.walletLabel.setText(''));
    }
  }

  private showWalletAddress(address: string): void {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`.toUpperCase();
    this.walletLabel.setText(`OPERATOR: ${short}`);
    this.walletLabel.setColor(MainMenu.S_AMBER);
  }

  private createHowToPlayOverlay(): void {
    const { width, height } = this.scale;
    
    this.howToPlayOverlay = this.add.container(0, 0).setDepth(1000).setVisible(false);
    
    // Dark semi-transparent background
    const bg = this.add.graphics();
    bg.fillStyle(0x0D0F14, 0.95);
    bg.fillRect(0, 0, width, height);
    this.howToPlayOverlay.add(bg);
    
    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(MainMenu.C_SURFACE, 0.8);
    panel.fillRoundedRect(width/2 - 300, height/2 - 200, 600, 400, 12);
    panel.lineStyle(2, MainMenu.C_TEAL, 0.6);
    panel.strokeRoundedRect(width/2 - 300, height/2 - 200, 600, 400, 12);
    this.howToPlayOverlay.add(panel);
    
    // Title
    this.howToPlayOverlay.add(this.add.text(width/2, height/2 - 160, 'CONTROLS & OBJECTIVE', {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '18px',
      color: MainMenu.S_TEAL,
      letterSpacing: 2,
    }).setOrigin(0.5));
    
    // Content
    const content = [
      "WASD / ARROWS — MOVE MAINT-AI",
      "SPACE — ROUTE COOLANT TO JUNCTION (requires coolant node)",
      "ESC — PAUSE",
      "",
      "OBJECTIVE:",
      "Navigate to each junction marker.",
      "Collect coolant nodes (—) from the floor.",
      "Route coolant to shut down each subsystem.",
      "Shut down all subsystems before meltdown.",
      "",
      "MACHINES: SORT-3X — WELD-7 — CONV-9 — PRESS-X — CORE-AI"
    ];
    
    content.forEach((line, index) => {
      this.howToPlayOverlay.add(this.add.text(width/2, height/2 - 100 + index * 18, line, {
        fontFamily: "'Geist Mono', monospace",
        fontSize: '11px',
        color: MainMenu.S_GREY,
        letterSpacing: 1,
      }).setOrigin(0.5));
    });
    
    // Close button
    const closeBtn = this.add.text(width/2, height/2 + 160, '[ CLOSE ]', {
      fontFamily: "'Azeret Mono', monospace",
      fontSize: '12px',
      color: MainMenu.S_GREY,
      letterSpacing: 3,
    }).setOrigin(0.5)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.hideHowToPlay())
     .on('pointerover', () => closeBtn.setColor(MainMenu.S_TEAL))
     .on('pointerout', () => closeBtn.setColor(MainMenu.S_GREY));
    
    this.howToPlayOverlay.add(closeBtn);
  }

  private toggleHowToPlay(): void {
    if (this.howToPlayVisible) {
      this.hideHowToPlay();
    } else {
      this.showHowToPlay();
    }
  }

  private showHowToPlay(): void {
    this.howToPlayOverlay.setVisible(true);
    this.howToPlayVisible = true;
    this.howToPlayBtn.setColor(MainMenu.S_TEAL);
    this.howToPlayBtn.setText('[ CLOSE HELP ]');
  }

  private hideHowToPlay(): void {
    this.howToPlayOverlay.setVisible(false);
    this.howToPlayVisible = false;
    this.howToPlayBtn.setColor(MainMenu.S_GREY);
    this.howToPlayBtn.setText('[ HOW TO PLAY ]');
  }
}
