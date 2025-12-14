import { defineSystem, defineQuery, IWorld, addComponent } from 'bitecs';
import Phaser from 'phaser';

import { Position, Projectile, Enemy, Renderable, Hit, Dead } from '../components';

/**
 * CollisionSystemManager handles collision detection between projectiles and enemies
 * Uses a manager pattern similar to other systems for consistency
 * 
 * Responsibilities:
 * - Detects collisions between projectiles and enemies using distance-based checks
 * - Creates Hit component on enemies when hit by projectiles
 * - Marks projectiles for removal when they hit an enemy
 * 
 * Note: This system processes all projectiles and enemies. Collision detection
 * uses simple distance calculation based on entity positions and sizes.
 * Damage application is handled by DamageSystem.
 */
class CollisionSystemManager {
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly projectileQuery = defineQuery([Projectile, Position, Renderable]);
  private readonly enemyQuery = defineQuery([Enemy, Position, Renderable]);
  private readonly deadQuery = defineQuery([Dead]);
  private readonly hitQuery = defineQuery([Hit]);

  /**
   * Initialize the collision system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialized = true;
  }

  /**
   * Calculate distance between two points
   * @param x1 - X coordinate of first point
   * @param y1 - Y coordinate of first point
   * @param x2 - X coordinate of second point
   * @param y2 - Y coordinate of second point
   * @returns Distance between the two points
   */
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Main update method called by the ECS system
   * Handles collision detection for all projectiles and enemies
   * @param world - ECS world instance
   * @param delta - Time delta in milliseconds
   * @returns Updated world
   */
  update(world: IWorld, _delta: number): IWorld {
    if (!this.initialized || !this.scene) return world;

    const projectiles = this.projectileQuery(world);
    const enemies = this.enemyQuery(world);
    const deadEntities = new Set(this.deadQuery(world));
    const hitEntities = new Set(this.hitQuery(world));

    // Process each projectile
    for (let i = 0; i < projectiles.length; i++) {
      const projectileEid = projectiles[i];

      // Skip if projectile is already marked for removal
      if (deadEntities.has(projectileEid)) {
        continue;
      }

      const projectileX = Position.x[projectileEid];
      const projectileY = Position.y[projectileEid];
      const projectileSize = Renderable.size[projectileEid];
      const projectileDamage = Projectile.damage[projectileEid];

      // Check collision with each enemy
      for (let j = 0; j < enemies.length; j++) {
        const enemyEid = enemies[j];

        // Skip if enemy is already marked for removal
        if (deadEntities.has(enemyEid)) {
          continue;
        }

        const enemyX = Position.x[enemyEid];
        const enemyY = Position.y[enemyEid];
        const enemySize = Renderable.size[enemyEid];

        // Calculate distance between projectile and enemy
        const distance = this.calculateDistance(
          projectileX,
          projectileY,
          enemyX,
          enemyY
        );

        // Collision threshold is sum of entity sizes
        const collisionThreshold = projectileSize + enemySize;

        // Check if collision occurred
        if (distance < collisionThreshold) {
          // Add Hit component to enemy with damage from projectile
          if (!hitEntities.has(enemyEid)) {
            addComponent(world, Hit, enemyEid);
            Hit.damage[enemyEid] = projectileDamage;
          } else {
            // If enemy already has Hit component, accumulate damage
            Hit.damage[enemyEid] += projectileDamage;
          }

          // Mark projectile for removal
          addComponent(world, Dead, projectileEid);

          // Break inner loop since projectile hit an enemy
          break;
        }
      }
    }

    return world;
  }
}

/**
 * Create a collision system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createCollisionSystem(scene: Phaser.Scene) {
  const manager = new CollisionSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
    return manager.update(world, delta);
  });
}

