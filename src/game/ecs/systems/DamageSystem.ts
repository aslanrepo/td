import { defineSystem, defineQuery, IWorld, addComponent, removeComponent } from 'bitecs';
import Phaser from 'phaser';

import { Enemy, Health, Hit, Dead } from '../components';

/**
 * DamageSystemManager handles damage application to enemies
 * Uses a manager pattern similar to other systems for consistency
 * 
 * Responsibilities:
 * - Processes Hit components on enemies
 * - Applies damage by reducing Health.currentHp
 * - Marks enemies for removal (adds Dead component) when HP reaches 0 or below
 * - Removes Hit component after damage is applied
 * 
 * Note: This system processes all entities with Enemy, Health, and Hit components.
 * Damage is applied immediately, and entities are marked for removal by DeathSystem
 * when their HP reaches 0 or below.
 */
class DamageSystemManager {
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly hitEnemyQuery = defineQuery([Enemy, Health, Hit]);
  private readonly deadQuery = defineQuery([Dead]);

  /**
   * Initialize the damage system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles damage application for all enemies with Hit component
   * @param world - ECS world instance
   * @param delta - Time delta in milliseconds
   * @returns Updated world
   */
  update(world: IWorld, _delta: number): IWorld {
    if (!this.initialized || !this.scene) return world;

    const hitEnemies = this.hitEnemyQuery(world);
    const deadEntities = new Set(this.deadQuery(world));

    // Process each enemy with Hit component
    for (let i = 0; i < hitEnemies.length; i++) {
      const enemyEid = hitEnemies[i];

      // Skip if already marked for removal
      if (deadEntities.has(enemyEid)) {
        // Remove Hit component even if dead (cleanup)
        removeComponent(world, Hit, enemyEid);
        continue;
      }

      // Get damage amount from Hit component
      const damage = Hit.damage[enemyEid];

      // Formula: newHp = currentHp - damage
      // Apply damage by reducing current HP
      Health.currentHp[enemyEid] -= damage;

      // Ensure HP doesn't go below 0
      if (Health.currentHp[enemyEid] < 0) {
        Health.currentHp[enemyEid] = 0;
      }

      // Check if enemy should be marked for removal
      if (Health.currentHp[enemyEid] <= 0) {
        // Mark enemy for removal
        addComponent(world, Dead, enemyEid);
      }

      // Remove Hit component after damage is applied
      removeComponent(world, Hit, enemyEid);
    }

    return world;
  }
}

/**
 * Create a damage system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createDamageSystem(scene: Phaser.Scene) {
  const manager = new DamageSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
    return manager.update(world, delta);
  });
}

