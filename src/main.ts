import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Preload } from './scenes/Preload';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 960,
  height: 540,
  backgroundColor: 'transparent',
  transparent: true,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  scene: [Boot, Preload, MainMenu, Game, GameOver],
};

const fallback = document.getElementById('boot-fallback');
if (fallback) {
  fallback.classList.add('hidden');
  setTimeout(() => fallback.remove(), 500);
}

export default new Phaser.Game(config);
