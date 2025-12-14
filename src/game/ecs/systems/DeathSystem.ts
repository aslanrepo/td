import { defineSystem, defineQuery, IWorld, removeEntity } from 'bitecs';
import Phaser from 'phaser';

import { Dead } from '../components';

/**
 * DeathSystemManager handles removal of dead entities
 * Uses a manager pattern similar to other systems for consistency
 * 
 * Responsibilities:
 * - Identifies entities marked with Dead component
 * - Removes entities from the ECS world using removeEntity from bitecs
 * - RenderSystemManager automatically cleans up sprites via exitQuery
 * 
 * Note: This system processes all entities with Dead component.
 * Entity removal triggers RenderSystemManager's exitQuery, which
 * automatically destroys associated sprites.
 */
class DeathSystemManager {
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly deadQuery = defineQuery([Dead]);

  /**
   * Initialize the death system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles removal of all entities marked as dead
   * 
   * Formula: removeEntity(world, entityId) - удаляет сущность из мира
   * 
   * @param world - ECS world instance (bitecs IWorld)
   * @param _delta - Time delta in milliseconds (not used)
   * @returns Updated world
   */
  update(world: IWorld, _delta: number): IWorld {
    if (!this.initialized || !this.scene) return world;

    const deadEntities = this.deadQuery(world);

    // Remove all dead entities directly using bitecs removeEntity
    // This removes the entity from the world, which triggers RenderSystemManager's
    // exitQuery to automatically clean up sprites
    for (let i = 0; i < deadEntities.length; i++) {
      const eid = deadEntities[i];
      removeEntity(world, eid);
    }

    return world;
  }
}

/**
 * Create a death system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createDeathSystem(scene: Phaser.Scene) {
  const manager = new DeathSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
    return manager.update(world, delta);
  });
}

