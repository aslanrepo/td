import { defineSystem, defineQuery, IWorld } from 'bitecs';
import Phaser from 'phaser';

import { Position, Projectile, Direction } from '../components';

/**
 * ProjectileMovementSystemManager handles straight-line movement for projectiles
 * Uses a manager pattern similar to RenderSystemManager for consistency
 * 
 * Responsibilities:
 * - Moves projectiles in a straight line based on their Direction component
 * - Uses fast speed to ensure projectiles hit their targets
 * - Only handles movement, collision detection is handled elsewhere
 * 
 * Note: This system processes all entities with Projectile, Position, and Direction components.
 * The Direction component stores velocity vector (vx, vy) in pixels per millisecond.
 */
class ProjectileMovementSystemManager {
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly projectileQuery = defineQuery([Projectile, Position, Direction]);

  /**
   * Initialize the projectile movement system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(_scene: Phaser.Scene) {
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles movement for all projectiles
   * @param world - ECS world instance
   * @param delta - Time delta in milliseconds
   * @returns Updated world
   */
  update(world: IWorld, delta: number): IWorld {
    if (!this.initialized) return world;

    const projectiles = this.projectileQuery(world);

    // Process each projectile
    for (let i = 0; i < projectiles.length; i++) {
      const eid = projectiles[i];

      // Get current position
      const posX = Position.x[eid];
      const posY = Position.y[eid];

      // Get velocity vector from Direction component (already in pixels per millisecond)
      const vx = Direction.vx[eid];
      const vy = Direction.vy[eid];

      // Update position: move by velocity * delta (delta is in milliseconds)
      // Since velocity is already in pixels/ms, we multiply by delta directly
      Position.x[eid] = posX + vx * delta;
      Position.y[eid] = posY + vy * delta;
    }

    return world;
  }
}

/**
 * Create a projectile movement system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createProjectileMovementSystem(scene: Phaser.Scene) {
  const manager = new ProjectileMovementSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
    return manager.update(world, delta);
  });
}

