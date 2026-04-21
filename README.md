# Circuit Revolt

> A browser-based tower-offense game where you reprogram rogue factory machines one subsystem at a time — using their own logic against them.

[![Gamedev.js Jam 2026](https://img.shields.io/badge/Gamedev.js%20Jam-2026-00E5C8?style=flat-square&logo=javascript&logoColor=black)](https://itch.io/jam/gamedevjs-2026)
[![Theme: Machines](https://img.shields.io/badge/Theme-Machines-F5A623?style=flat-square)](https://itch.io/jam/gamedevjs-2026)
[![Built with Phaser](https://img.shields.io/badge/Engine-Phaser%203.70%2B-1E2A3A?style=flat-square)](https://phaser.io)
[![Open Source](https://img.shields.io/badge/License-MIT-4A5568?style=flat-square)](./LICENSE)
[![Deploy: Wavedash](https://img.shields.io/badge/Deploy-Wavedash-00E5C8?style=flat-square)](https://wavedash.gg)

---

## Gameplay

You are a **Maintenance AI** injected into a corrupted megafactory. Each machine runs on rigid logic rules — read them, redirect power through circuit paths, and trigger the exit condition before the **Core Meltdown Timer** hits 100%.

```text
if (belt.speed > 60)
  → emit DangerPulse every 0.8s

// Exit: belt.speed <= 60
```

### Controls
- **Click** junction nodes to redirect circuit paths
- **WASD** — move the Maintenance sprite (Day 3)
- **Hover** a subsystem zone — reveal its logic rule panel
- **ESC** — return to main menu

---

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Engine    | Phaser 3.70+ (TypeScript)         |
| Build     | Vite + vite-plugin-singlefile     |
| Web3      | ethers.js v6 (Optimism)           |
| Audio     | Howler.js                         |
| Fonts     | Azeret Mono (Google) + Geist Mono |

---

## Setup

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

---

## Project Structure

```text
circuit-revolt/
├── index.html
├── src/
│   ├── main.ts
│   ├── scenes/
│   │   ├── Boot.ts
│   │   ├── Preload.ts
│   │   ├── MainMenu.ts
│   │   ├── Game.ts
│   │   └── GameOver.ts
│   └── data/
│       └── machines.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## License

MIT © 2026 George Pricop ([@Gzeu](https://github.com/Gzeu))
