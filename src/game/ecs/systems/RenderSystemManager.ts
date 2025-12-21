import { defineSystem, defineQuery, enterQuery, exitQuery, IWorld } from 'bitecs';
import Phaser from 'phaser';

import { Position, Renderable, Tower, Range } from '../components';

/**
 * SimpleRenderSystemManager handles sprite creation, updates, and cleanup for ECS entities
 * Uses a simplified approach without object pooling for better reliability
 * Automatically cleans up sprites when scene is destroyed
 */
class SimpleRenderSystemManager {
  private spriteMap = new Map<number, Phaser.GameObjects.GameObject>();
  private rangeRingMap = new Map<number, Phaser.GameObjects.Arc>();
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  private readonly ENEMY_TYPE = 0;
  private readonly TOWER_TYPE = 1;
  private readonly PROJECTILE_TYPE = 2;
  
  // Pre-defined queries for performance
  private readonly entityQuery = defineQuery([Position, Renderable]);
  private readonly enterQ = enterQuery(this.entityQuery);
  private readonly exitQ = exitQuery(this.entityQuery);
  
  // Query for towers with range (to create/update range rings)
  private readonly towerQuery = defineQuery([Position, Renderable, Tower, Range]);

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
    
    // Destroy all range rings
    this.rangeRingMap.forEach(ring => {
      if (ring.scene) { // Check that ring still exists
        ring.destroy();
      }
    });
    this.rangeRingMap.clear();
    
    this.initialized = false;
    this.scene = null;
  }

  /**
   * Create a new sprite object for the given entity type
   * All visual properties (size, color) are taken from Renderable component
   * @param type - Entity type (0 for enemy, 1 for tower, 2 for projectile)
   * @param size - Size from Renderable component
   * @param color - Color from Renderable component
   * @returns New sprite object or null if scene is not available
   */
  private createSprite(type: number, size: number, color: number): Phaser.GameObjects.GameObject | null {
    if (!this.scene) return null;
    
    // Create sprite with size and color from Renderable component
    let sprite: Phaser.GameObjects.GameObject;
    
    if (type === this.ENEMY_TYPE) {
      sprite = this.scene.add.circle(0, 0, size, color);
    } else if (type === this.PROJECTILE_TYPE) {
      sprite = this.scene.add.circle(0, 0, size, color);
    } else {
      // Tower type (default)
      sprite = this.scene.add.rectangle(0, 0, size, size, color);
    }
    
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
    
    // Update range rings for towers
    this.updateRangeRings(world);
    
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
   * All visual properties are read from Renderable component
   * @param eid - Entity ID to create sprite for
   */
  private createSpriteForEntity(eid: number) {
    const x = Position.x[eid];
    const y = Position.y[eid];
    const type = Renderable.type[eid];
    const color = Renderable.color[eid];
    const size = Renderable.size[eid];

    // Create sprite with size and color from Renderable component
    const sprite = this.createSprite(type, size, color);
    if (!sprite) return;

    // Configure additional properties (depth, stroke, position, etc.)
    this.configureSprite(sprite, type, x, y);
    this.spriteMap.set(eid, sprite);
    
    // Create range ring for towers
    if (type === this.TOWER_TYPE) {
      this.createRangeRing(eid);
    }
  }
  
  /**
   * Create a range ring visualization for a tower
   * @param eid - Entity ID of the tower
   */
  private createRangeRing(eid: number) {
    if (!this.scene) return;
    
    // Check if tower has Range component and valid range value
    if (!Range.value || Range.value[eid] === undefined || Range.value[eid] <= 0) return;
    
    const x = Position.x[eid];
    const y = Position.y[eid];
    const range = Range.value[eid];
    
    // Create a circle to represent the range (no fill, only stroke)
    const ring = this.scene.add.circle(x, y, range, 0xffffff, 0); // No fill
    ring.setStrokeStyle(2, 0xffffff, 0.3); // White stroke with 30% opacity
    ring.setDepth(0); // Render behind everything
    
    this.rangeRingMap.set(eid, ring);
  }

  /**
   * Configure sprite properties based on entity type
   * Size and color are already set during sprite creation from Renderable component
   * This method only sets type-specific properties (depth, stroke, etc.)
   * @param sprite - Sprite object to configure
   * @param type - Entity type (0 for enemy, 1 for tower, 2 for projectile)
   * @param x - X position
   * @param y - Y position
   */
  private configureSprite(
    sprite: Phaser.GameObjects.GameObject,
    type: number,
    x: number,
    y: number
  ) {
    const shape = sprite as Phaser.GameObjects.Shape;
    
    // Set depth based on entity type (rendering order)
    if (type === this.ENEMY_TYPE) {
      shape.setDepth(1);
    } else if (type === this.PROJECTILE_TYPE) {
      // Projectiles should be rendered on top of enemies but below towers
      shape.setDepth(3);
    } else {
      // Tower type - add stroke for better visibility
      const rect = shape as Phaser.GameObjects.Rectangle;
      rect.setStrokeStyle(2, 0x000000);
      shape.setDepth(2);
    }

    // Set common properties
    shape.setActive(true);
    shape.setVisible(true);
    shape.setPosition(x, y);

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
        (sprite as Phaser.GameObjects.Shape).setPosition(x, y);
      }
      
      // Update range ring position if it exists
      const ring = this.rangeRingMap.get(eid);
      if (ring) {
        const x = Position.x[eid];
        const y = Position.y[eid];
        ring.setPosition(x, y);
      }
    }
  }
  
  /**
   * Update range rings for all towers
   * Ensures range rings are created for towers that don't have them yet
   * @param world - ECS world instance
   */
  private updateRangeRings(world: IWorld) {
    const towers = this.towerQuery(world);
    
    for (const eid of towers) {
      // Create range ring if it doesn't exist
      if (!this.rangeRingMap.has(eid)) {
        this.createRangeRing(eid);
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
      
      // Clean up range ring if it exists
      const ring = this.rangeRingMap.get(eid);
      if (ring) {
        ring.destroy();
        this.rangeRingMap.delete(eid);
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

