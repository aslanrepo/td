# td

A tower-defense prototype: Phaser 3 draws and handles input, [bitecs](https://github.com/NateTheGreatt/bitECS) holds the game state, a small React layer wraps the canvas, and the whole thing runs as a Telegram Mini App. The point of the project was to try a data-oriented ECS next to a scene-graph engine and see where the seam ends up.

## How it is put together

- `src/game/ecs/components/` — typed-array components (`Position`, `Velocity`, `Health`, …) and marker components such as `Enemy` and `Dead`.
- `src/game/ecs/systems/` — one system per mechanic. `World.ts` runs them in a fixed order: path movement → targeting → firing → projectile movement and lifetime → collision → damage → death → render. A new mechanic is one more system; the others do not change.
- `src/game/ecs/systems/pathGeometry.ts` — the lane offsets as a pure function with no Phaser dependency, covered by `pathGeometry.test.ts`. Enemies walk one of three lanes built from a single list of waypoints.
- `src/game/ecs/systems/RenderSystemManager.ts` — the only system that touches Phaser game objects. It creates and destroys sprites from bitecs enter/exit queries, so gameplay systems never hold a sprite reference: removing an entity is enough.
- `src/game/scenes/` — `MenuScene` and `SandboxScene` (spawn enemies with chosen parameters, place towers, hold to remove them, see their range).
- `src/game/config/` — enemy parameters and visuals as JSON.
- `src/App.tsx`, `src/PhaserGame.tsx`, `src/game/EventBus.ts` — the React shell around the Phaser canvas and the event bus between them.

## Scripts

```bash
npm install
npm run dev          # HTTPS dev server (Telegram Mini Apps require HTTPS)
npm run build
npm test             # node --test over the pure modules
npm run type-check
npm run lint
```

## How it was built

Designed and reviewed by me; most of the code was typed by coding agents (Claude Code and similar). The decisions are mine: the ECS/Phaser split, the system order, the lanes derived from one offset function. The agents did the typing, I read and ran the result.
