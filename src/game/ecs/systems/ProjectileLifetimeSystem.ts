import { defineSystem, defineQuery, IWorld, addComponent } from 'bitecs';
import Phaser from 'phaser';

import { Projectile, Dead } from '../components';

/**
 * ProjectileLifetimeSystemManager handles lifetime expiration for projectiles
 * Uses a manager pattern similar to other systems for consistency
 * 
 * Responsibilities:
 * - Checks if projectiles have exceeded their lifetime
 * - Marks expired projectiles for removal by adding Dead component
 * - Handles missed projectiles that don't hit any target
 * 
 * Note: This system processes all entities with Projectile component.
 * Projectiles are marked for removal by adding Dead component, which is
 * processed by DeathSystem.
 */
class ProjectileLifetimeSystemManager {
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly projectileQuery = defineQuery([Projectile]);
  private readonly deadQuery = defineQuery([Dead]);

  /**
   * Initialize the projectile lifetime system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles lifetime checking for all projectiles
   * @param world - ECS world instance
   * @param delta - Time delta in milliseconds
   * @returns Updated world
   */
  update(world: IWorld, _delta: number): IWorld {
    if (!this.initialized || !this.scene) return world;

    const projectiles = this.projectileQuery(world);
    const deadEntities = new Set(this.deadQuery(world));
    const currentTime = this.scene.time.now;

    // Process each projectile
    for (let i = 0; i < projectiles.length; i++) {
      const eid = projectiles[i];

      // Skip if already marked for removal
      if (deadEntities.has(eid)) {
        continue;
      }

      // Check if projectile has exceeded its lifetime
      const spawnTime = Projectile.spawnTime[eid];
      const lifetime = Projectile.lifetime[eid];
      const elapsedTime = currentTime - spawnTime;

      if (elapsedTime >= lifetime) {
        // Mark projectile for removal
        addComponent(world, Dead, eid);
      }
    }

    return world;
  }
}

/**
 * Create a projectile lifetime system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createProjectileLifetimeSystem(scene: Phaser.Scene) {
  const manager = new ProjectileLifetimeSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
    return manager.update(world, delta);
  });
}

