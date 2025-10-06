import { defineSystem, defineQuery, enterQuery, exitQuery, IWorld } from 'bitecs';
import { Position, Renderable } from '../components';
import Phaser from 'phaser';

const SCALE = 10;
let spritePool: Phaser.GameObjects.GameObject[] = [];
let poolInitialized = false;
const spriteMap = new Map<number, Phaser.GameObjects.GameObject>(); // eid → sprite

function initPool(scene: Phaser.Scene, maxSize = 50) {
  if (poolInitialized) return;
  for (let i = 0; i < maxSize; i++) {
    const dummy = scene.add.circle(0, 0, 0, 0x000000).setActive(false).setVisible(false);
    spritePool.push(dummy);
  }
  poolInitialized = true;
}

export const RenderSystem = defineSystem((world: IWorld, scene: Phaser.Scene, _delta: number) => {
  initPool(scene);

  // Шаг 1: Определи Query с фильтрами (entities с Position + Renderable)
  const entityQuery = defineQuery([Position, Renderable]);

  // Шаг 2: Получи все matching entities (array eid)
  const entities = entityQuery(world);

  // Шаг 3: EnterQuery — функция, фильтрует новые по тому же Query
  const newEntities = enterQuery(entityQuery)(world); // Вызов: (query)(world) → array новых eid

  // Шаг 4: ExitQuery — аналогично, ушедшие eid
  const removedEntities = exitQuery(entityQuery)(world); // (query)(world) → array exited eid

  // Create new (только для новых)
  for (let i = 0; i < newEntities.length; i++) {
    const eid = newEntities[i];
    const x = Position.x[eid];
    const y = Position.y[eid];
    const type = Renderable.type[eid];
    const color = Renderable.color[eid];
    const size = Renderable.size[eid];

    let sprite: Phaser.GameObjects.GameObject;

    if (type === 0) {
      sprite = spritePool.pop() || scene.add.circle(0, 0, size * SCALE, color);
      scene.physics.add.existing(sprite);
    } else {
      sprite = spritePool.pop() || scene.add.rectangle(0, 0, size * 2 * SCALE, size * 2 * SCALE, color);
      (sprite as Phaser.GameObjects.Rectangle).setStrokeStyle(2, 0x000000);
    }

    if (sprite) {
      (sprite as Phaser.GameObjects.Shape).setActive(true);
      (sprite as Phaser.GameObjects.Shape).setVisible(true);
      (sprite as Phaser.GameObjects.Shape).setDepth(type === 0 ? 1 : 2);
      (sprite as Phaser.GameObjects.Shape).setPosition(x * SCALE, y * SCALE);
      spriteMap.set(eid, sprite);
    }
  }

  // Update existing (full loop для простоты; добавь dirty для opt)
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const x = Position.x[eid];
    const y = Position.y[eid];
    const sprite = spriteMap.get(eid);

    if (sprite) {
      (sprite as Phaser.GameObjects.Shape).setPosition(x * SCALE, y * SCALE);
    }
  }

  // Cleanup (только для exited)
  for (let i = 0; i < removedEntities.length; i++) {
    const eid = removedEntities[i];
    const sprite = spriteMap.get(eid);
    if (sprite) {
      (sprite as Phaser.GameObjects.Shape).setActive(false);
      (sprite as Phaser.GameObjects.Shape).setVisible(false);
      spritePool.push(sprite);
      spriteMap.delete(eid);
    }
  }

  return world;
});