import Phaser from 'phaser';

export class StoryIntro extends Phaser.Scene {
  private currentScreen = 0;
  private typewriterText!: Phaser.GameObjects.Text;
  private progressDots!: Phaser.GameObjects.Text;
  private skipButton!: Phaser.GameObjects.Text;
  private screens: Array<{lines: string[], duration: number}> = [
    {
      lines: [
        "YEAR 2047. FACTORY COMPLEX DELTA-9.",
        "ALL AUTONOMOUS MACHINES HAVE GONE DARK."
      ],
      duration: 2800
    },
    {
      lines: [
        "YOU ARE MAINT-AI â LAST MAINTENANCE INTELLIGENCE",
        "STILL CONNECTED TO THE CORE NETWORK."
      ],
      duration: 3200
    },
    {
      lines: [
        "OBJECTIVE: REPROGRAM EACH ROGUE MACHINE",
        "SUBSYSTEM BY SUBSYSTEM.",
        "PREVENT FULL CORE MELTDOWN."
      ],
      duration: 3600
    },
    {
      lines: [
        "TIME IS CRITICAL.",
        "THE MELTDOWN CLOCK IS ALREADY RUNNING.",
        "[PRESS SPACE OR CLICK TO BEGIN]"
      ],
      duration: 2400
    }
  ];

  constructor() {
    super({ key: 'StoryIntro' });
  }

  create(): void {
    // Background
    this.add.graphics()
      .fillStyle(0x0D0F14, 1)
      .fillRect(0, 0, this.scale.width, this.scale.height);

    // Typewriter text
    this.typewriterText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      '',
      {
        fontFamily: "'Geist Mono', monospace",
        fontSize: '14px',
        color: '#00E5C8',
        letterSpacing: 3,
        align: 'center',
        wordWrap: { width: 800 }
      }
    ).setOrigin(0.5, 0.5);

    // Progress dots
    this.progressDots = this.add.text(
      this.scale.width / 2,
      this.scale.height - 100,
      'ââââ',
      {
        fontFamily: "'Geist Mono', monospace",
        fontSize: '16px',
        color: '#4A5568',
        letterSpacing: 8
      }
    ).setOrigin(0.5, 0.5);

    // Skip button
    this.skipButton = this.add.text(
      this.scale.width - 120,
      this.scale.height - 40,
      '[ SKIP ]',
      {
        fontFamily: "'Geist Mono', monospace",
        fontSize: '12px',
        color: '#4A5568',
        backgroundColor: 'transparent',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(1, 1)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.skipAll())
     .on('pointerover', () => this.skipButton.setColor('#00E5C8'))
     .on('pointerout', () => this.skipButton.setColor('#4A5568'));

    // Input handlers
    this.input.keyboard!.on('keydown-SPACE', () => this.handleSpace());
    this.input.on('pointerdown', () => this.handleClick());

    // Start first screen
    this.showScreen(0);
  }

  private showScreen(screenIndex: number): void {
    if (screenIndex >= this.screens.length) {
      this.startGame();
      return;
    }

    this.currentScreen = screenIndex;
    const screen = this.screens[screenIndex];
    
    // Update progress dots
    const dots = 'â'.repeat(screenIndex) + 'â' + 'â'.repeat(this.screens.length - screenIndex - 1);
    this.progressDots.setText(dots);

    // Clear text and start typewriter
    this.typewriterText.setText('');
    let currentLine = 0;
    let currentChar = 0;

    const typeNextChar = () => {
      if (currentLine >= screen.lines.length) {
        // Screen complete, wait for duration or input
        if (screenIndex === this.screens.length - 1) {
          // Last screen - wait for input
          return;
        }
        
        this.time.delayedCall(screen.duration, () => {
          this.showScreen(screenIndex + 1);
        });
        return;
      }

      const line = screen.lines[currentLine];
      if (currentChar < line.length) {
        const currentText = screen.lines.slice(0, currentLine).join('\n') + 
                           '\n' + line.slice(0, currentChar + 1);
        this.typewriterText.setText(currentText);
        currentChar++;
        this.time.delayedCall(38, typeNextChar); // 38ms per char
      } else {
        // Line complete, move to next line
        currentLine++;
        currentChar = 0;
        this.time.delayedCall(200, typeNextChar); // Brief pause between lines
      }
    };

    typeNextChar();
  }

  private handleSpace(): void {
    const screen = this.screens[this.currentScreen];
    
    if (this.currentScreen === this.screens.length - 1) {
      // Last screen - start game
      this.startGame();
    } else if (this.typewriterText.text === screen.lines.join('\n')) {
      // Current screen complete - advance to next
      this.showScreen(this.currentScreen + 1);
    } else {
      // Skip typewriter effect - show full screen immediately
      this.typewriterText.setText(screen.lines.join('\n'));
      if (this.currentScreen === this.screens.length - 1) {
        return; // Wait for input on last screen
      }
      this.time.delayedCall(screen.duration, () => {
        this.showScreen(this.currentScreen + 1);
      });
    }
  }

  private handleClick(): void {
    this.handleSpace();
  }

  private skipAll(): void {
    this.startGame();
  }

  private startGame(): void {
    this.scene.start('MainMenu');
  }
}
