import { defineSystem, defineQuery, enterQuery, exitQuery, IWorld } from 'bitecs';
import { Position, Renderable } from '../components';
import Phaser from 'phaser';

// Constants
const SCALE = 10; // Scale factor for converting game units to pixels
const POOL_SIZE = 50; // Maximum number of sprites in the pool
const LOG_INTERVAL = 60; // Log pool status every N frames
const ENEMY_TYPE = 0; // Entity type for enemies
const ENEMY_DEPTH = 1; // Rendering depth for enemies
const TOWER_DEPTH = 2; // Rendering depth for towers
const STROKE_WIDTH = 2; // Border width for tower sprites
const STROKE_COLOR = 0x000000; // Black border color

// Global state for sprite management
const spritePool: Phaser.GameObjects.GameObject[] = []; // Available sprites for reuse
let poolInitialized = false; // Flag to ensure pool is initialized only once
const spriteMap = new Map<number, Phaser.GameObjects.GameObject>(); // Maps entity ID to active sprite
let frameCounter = 0; // Counter for logging intervals

// Queries defined outside system because they're mutable
// This avoids recreating queries on every frame, which is expensive
const entityQuery = defineQuery([Position, Renderable]);
const enterQ = enterQuery(entityQuery); // Stateful query that tracks entity changes
const exitQ = exitQuery(entityQuery); // Stateful query that tracks entity removals

/**
 * Initialize sprite pool with dummy objects for reuse
 * Called once per scene to avoid memory allocation during gameplay
 */
function initPool(scene: Phaser.Scene) {
  if (poolInitialized) return;
  
  for (let i = 0; i < POOL_SIZE; i++) {
    const dummy = scene.add.circle(0, 0, 0, 0x000000).setActive(false).setVisible(false);
    spritePool.push(dummy);
  }
  poolInitialized = true;
}

/**
 * RenderSystem manages sprite creation, updates, and cleanup for ECS entities
 * Uses object pooling to avoid frequent memory allocation during gameplay
 * 
 * Query optimization: Queries are defined outside the system to avoid recreation each frame
 * Set usage: Used for efficient O(1) duplicate detection in entity arrays
 */
export const RenderSystem = defineSystem((world: IWorld, scene: Phaser.Scene, _delta: number) => {
  initPool(scene);

  // Log pool status at regular intervals to avoid console spam
  frameCounter++;
  if (frameCounter % LOG_INTERVAL === 0) {
    console.log(`RenderSystem: Pool size: ${spritePool.length}, Active sprites: ${spriteMap.size}`);
  }

  // Get entities using pre-defined queries for better performance
  const entities = entityQuery(world);
  const newEntities = enterQ(world);
  const removedEntities = exitQ(world);

  // Create Set for O(1) lookup to exclude new entities from update loop
  // This prevents double-processing entities that were just created
  const newSet = new Set(newEntities);

  // Create sprites for new entities
  for (let i = 0; i < newEntities.length; i++) {
    const eid = newEntities[i];
    const x = Position.x[eid];
    const y = Position.y[eid];
    const type = Renderable.type[eid];
    const color = Renderable.color[eid];
    const size = Renderable.size[eid];

    let sprite: Phaser.GameObjects.GameObject;

    if (type === ENEMY_TYPE) {
      // Enemy sprite - circle
      sprite = spritePool.pop() || scene.add.circle(0, 0, size * SCALE, color);
      scene.physics.add.existing(sprite);
    } else {
      // Tower sprite - rectangle
      sprite = spritePool.pop() || scene.add.rectangle(0, 0, size * 2 * SCALE, size * 2 * SCALE, color);
      (sprite as Phaser.GameObjects.Rectangle).setStrokeStyle(STROKE_WIDTH, STROKE_COLOR);
    }

    if (sprite) {
      // Configure sprite properties for new entities
      if (type === ENEMY_TYPE) {
        (sprite as Phaser.GameObjects.Arc).setRadius(size * SCALE);
        (sprite as Phaser.GameObjects.Arc).setFillStyle(color);
      } else {
        (sprite as Phaser.GameObjects.Rectangle).setSize(size * 2 * SCALE, size * 2 * SCALE);
        (sprite as Phaser.GameObjects.Rectangle).setFillStyle(color);
      }

      (sprite as Phaser.GameObjects.Shape).setActive(true);
      (sprite as Phaser.GameObjects.Shape).setVisible(true);
      (sprite as Phaser.GameObjects.Shape).setDepth(type === ENEMY_TYPE ? ENEMY_DEPTH : TOWER_DEPTH);
      (sprite as Phaser.GameObjects.Shape).setPosition(x * SCALE, y * SCALE);
      spriteMap.set(eid, sprite);
    }
  }

  // Update positions for existing entities, excluding newly created ones
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (newSet.has(eid)) continue; // Skip new entities as they were already positioned

    const x = Position.x[eid];
    const y = Position.y[eid];
    const sprite = spriteMap.get(eid);

    if (sprite) {
      (sprite as Phaser.GameObjects.Shape).setPosition(x * SCALE, y * SCALE);
    }
  }

  // Cleanup removed entities and return sprites to pool
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