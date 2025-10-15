import { defineSystem, defineQuery, enterQuery, exitQuery, IWorld } from 'bitecs';
import { Position, Renderable } from '../components';
import Phaser from 'phaser';

/**
 * SimpleRenderSystemManager handles sprite creation, updates, and cleanup for ECS entities
 * Uses a simplified approach without object pooling for better reliability
 * Automatically cleans up sprites when scene is destroyed
 */
class SimpleRenderSystemManager {
  private spriteMap = new Map<number, Phaser.GameObjects.GameObject>();
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Constants
  private readonly SCALE = 10;
  private readonly ENEMY_TYPE = 0;
  
  // Pre-defined queries for performance
  private readonly entityQuery = defineQuery([Position, Renderable]);
  private readonly enterQ = enterQuery(this.entityQuery);
  private readonly exitQ = exitQuery(this.entityQuery);

  /**
   * Initialize the render system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(scene: Phaser.Scene) {
    // Cleanup previous scene if exists
    this.cleanup();
    
    this.scene = scene;
    this.setupSceneEvents();
    this.initialized = true;
  }


  /**
   * Set up scene event listeners for automatic cleanup
   */
  private setupSceneEvents() {
    if (!this.scene) return;
    
    // Auto-cleanup when scene is destroyed
    this.scene.events.once('shutdown', () => this.cleanup());
  }

  /**
   * Clean up all sprites and reset the manager state
   * Called automatically when scene is destroyed
   */
  private cleanup() {
    // Destroy all sprites when scene changes
    this.spriteMap.forEach(sprite => {
      if (sprite.scene) { // Check that sprite still exists
        sprite.destroy();
      }
    });
    this.spriteMap.clear();
    this.initialized = false;
    this.scene = null;
  }

  /**
   * Create a new sprite object for the given entity type
   * @param type - Entity type (0 for enemy, 1 for tower)
   * @returns New sprite object or null if scene is not available
   */
  private createSprite(type: number): Phaser.GameObjects.GameObject | null {
    if (!this.scene) return null;
    
    // Create new sprite object each time (no object pooling)
    const sprite = type === this.ENEMY_TYPE 
      ? this.scene.add.circle(0, 0, 10, 0xff0000)
      : this.scene.add.rectangle(0, 0, 20, 20, 0x00ff00);
    
    return sprite;
  }


  /**
   * Main update method called by the ECS system
   * Handles sprite creation, updates, and cleanup for all entities
   * @param world - ECS world instance
   * @returns Updated world
   */
  update(world: IWorld): IWorld {
    if (!this.initialized || !this.scene) return world;

    const entities = this.entityQuery(world);
    const newEntities = this.enterQ(world);
    const removedEntities = this.exitQ(world);
    const newSet = new Set(newEntities);

    // Create sprites for new entities
    this.handleNewEntities(newEntities);
    
    // Update positions of existing entities
    this.updateExistingEntities(entities, newSet);
    
    // Clean up removed entities
    this.handleRemovedEntities(removedEntities);

    return world;
  }

  /**
   * Handle creation of sprites for new entities
   * @param newEntities - Array of entity IDs that were just created
   */
  private handleNewEntities(newEntities: number[]) {
    for (const eid of newEntities) {
      this.createSpriteForEntity(eid);
    }
  }

  /**
   * Create and configure a sprite for a specific entity
   * @param eid - Entity ID to create sprite for
   */
  private createSpriteForEntity(eid: number) {
    const x = Position.x[eid];
    const y = Position.y[eid];
    const type = Renderable.type[eid];
    const color = Renderable.color[eid];
    const size = Renderable.size[eid];

    const sprite = this.createSprite(type);
    if (!sprite) return;

    this.configureSprite(sprite, type, size, color, x, y);
    this.spriteMap.set(eid, sprite);
  }

  /**
   * Configure sprite properties based on entity data
   * @param sprite - Sprite object to configure
   * @param type - Entity type (0 for enemy, 1 for tower)
   * @param size - Entity size
   * @param color - Entity color
   * @param x - X position
   * @param y - Y position
   */
  private configureSprite(
    sprite: Phaser.GameObjects.GameObject,
    type: number,
    size: number,
    color: number,
    x: number,
    y: number
  ) {
    const shape = sprite as Phaser.GameObjects.Shape;
    
    if (type === this.ENEMY_TYPE) {
      const circle = shape as Phaser.GameObjects.Arc;
      circle.setRadius(size * this.SCALE);
      circle.setFillStyle(color);
      shape.setDepth(1);
    } else {
      const rect = shape as Phaser.GameObjects.Rectangle;
      rect.setSize(size * 2 * this.SCALE, size * 2 * this.SCALE);
      rect.setFillStyle(color);
      rect.setStrokeStyle(2, 0x000000);
      shape.setDepth(2);
    }

    shape.setActive(true);
    shape.setVisible(true);
    shape.setPosition(x * this.SCALE, y * this.SCALE);

    if (sprite.body && 'enable' in sprite.body) {
      (sprite.body as Phaser.Physics.Arcade.Body).enable = true;
    }
  }

  /**
   * Update positions of existing entity sprites
   * @param entities - Array of all entity IDs
   * @param newSet - Set of newly created entities to skip
   */
  private updateExistingEntities(entities: number[], newSet: Set<number>) {
    for (const eid of entities) {
      if (newSet.has(eid)) continue;

      const sprite = this.spriteMap.get(eid);
      if (sprite) {
        const x = Position.x[eid];
        const y = Position.y[eid];
        (sprite as Phaser.GameObjects.Shape).setPosition(x * this.SCALE, y * this.SCALE);
      }
    }
  }

  /**
   * Handle cleanup of sprites for removed entities
   * @param removedEntities - Array of entity IDs that were removed
   */
  private handleRemovedEntities(removedEntities: number[]) {
    for (const eid of removedEntities) {
      const sprite = this.spriteMap.get(eid);
      if (sprite) {
        sprite.destroy();
        this.spriteMap.delete(eid);
      }
    }
  }
}

/**
 * Create a render system for the given scene
 * Each scene gets its own manager instance for proper cleanup
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createRenderSystem(scene: Phaser.Scene) {
  const manager = new SimpleRenderSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld) => {
    return manager.update(world);
  });
}

