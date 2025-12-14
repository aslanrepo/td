import { defineSystem, defineQuery, IWorld, addComponent } from 'bitecs';
import Phaser from 'phaser';

import { Position, Target, Firing, Projectile, Renderable, Tower, Enemy, NO_TARGET, Direction } from '../components';
import { GameWorld } from '../World';

/**
 * Constant projectile speed
 * This ensures projectiles move in a straight line at constant speed
 * Speed is set to be visible but fast enough to hit moving targets
 */
const PROJECTILE_SPEED = 1500; // pixels per second (visible but fast enough to hit moving targets)

/**
 * Default projectile lifetime in milliseconds
 * Projectiles will be destroyed if they don't hit within this time
 */
const DEFAULT_PROJECTILE_LIFETIME = 5000; // 5 seconds

/**
 * Renderable type for projectiles
 * Using type 2 to distinguish from enemies (0) and towers (1)
 */
const PROJECTILE_RENDER_TYPE = 2;

/**
 * FiringSystemManager handles shooting logic for towers
 * Uses a manager pattern similar to RenderSystemManager for consistency
 * 
 * Responsibilities:
 * - Identifies towers capable of shooting
 * - Checks if towers have valid targets
 * - Validates fire interval (cooldown)
 * - Calculates projectile direction and velocity
 * - Creates projectile entities
 * - Updates tower's last shot time
 * 
 * Note: This system only initiates shots. Projectile movement is handled by
 * ProjectileMovementSystem, collision detection is handled by other systems.
 */
class FiringSystemManager {
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly firingTowerQuery = defineQuery([Tower, Position, Target, Firing]);
  private readonly enemyQuery = defineQuery([Enemy, Position]);

  /**
   * Initialize the firing system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles shooting logic for all towers
   * @param world - ECS world instance
   * @param delta - Time delta in milliseconds
   * @returns Updated world
   */
  update(world: IWorld, delta: number): IWorld {
    if (!this.initialized || !this.scene) return world;

    const towers = this.firingTowerQuery(world);
    const enemies = this.enemyQuery(world);
    
    // Create a Set for fast enemy lookup
    const enemySet = new Set(enemies);

    // Get current game time (in milliseconds)
    const currentTime = this.scene.time.now;

    // Process each shooting tower
    for (let i = 0; i < towers.length; i++) {
      const towerEid = towers[i];

      // Step 1: Check if tower has a valid target
      const targetEid = Target.eid[towerEid];
      
      // Skip if no target
      if (targetEid === NO_TARGET) {
        continue;
      }

      // Step 2: Validate target exists and is alive
      // In ECS, if entity exists and has Enemy component, it's considered alive
      // Future: can add Health component for more sophisticated checks
      if (!enemySet.has(targetEid)) {
        // Target no longer exists (destroyed or invalid)
        continue;
      }

      // Step 3: Check fire interval (cooldown)
      const lastShotTime = Firing.lastShotTime[towerEid];
      const fireInterval = Firing.fireInterval[towerEid];
      const timeSinceLastShot = currentTime - lastShotTime;

      if (timeSinceLastShot < fireInterval) {
        // Tower is still on cooldown
        continue;
      }

      // Step 4: Calculate direction vector from tower to target
      const towerX = Position.x[towerEid];
      const towerY = Position.y[towerEid];
      const targetX = Position.x[targetEid];
      const targetY = Position.y[targetEid];

      const dx = targetX - towerX;
      const dy = targetY - towerY;

      // Skip if target is at same position (zero vector)
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 0.001) {
        continue;
      }

      // Normalize direction vector
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Calculate velocity vector (direction * speed)
      // Convert speed from pixels/second to pixels/millisecond for consistency
      const velocityX = dirX * PROJECTILE_SPEED / 1000;
      const velocityY = dirY * PROJECTILE_SPEED / 1000;

      // Step 5: Create projectile entity
      const gameWorld = this.scene.registry.get('gameWorld') as GameWorld;
      if (!gameWorld) {
        console.warn('FiringSystemManager: GameWorld not found in scene registry');
        continue;
      }

      const projectileEid = gameWorld.createEntity();

      // Add Position component (start at tower position)
      addComponent(world, Position, projectileEid);
      Position.x[projectileEid] = towerX;
      Position.y[projectileEid] = towerY;

      // Add Direction component (stores velocity vector for straight-line movement)
      addComponent(world, Direction, projectileEid);
      Direction.vx[projectileEid] = velocityX;
      Direction.vy[projectileEid] = velocityY;

      // Add Projectile component
      addComponent(world, Projectile, projectileEid);
      // Get damage from tower (assuming Tower has damage, or we need to add it)
      // For now, let's use a default or get from Range or create Damage component
      // Actually, towers don't have damage yet. Let me use a default for now.
      Projectile.damage[projectileEid] = 10; // Default damage, can be configured per tower type
      Projectile.lifetime[projectileEid] = DEFAULT_PROJECTILE_LIFETIME;
      Projectile.spawnTime[projectileEid] = currentTime;

      // Add Renderable component for visualization
      addComponent(world, Renderable, projectileEid);
      Renderable.type[projectileEid] = PROJECTILE_RENDER_TYPE;
      Renderable.color[projectileEid] = 0xffff00; // Yellow color for projectiles
      Renderable.size[projectileEid] = 10; // Small size for projectiles

      // Step 6: Update tower's last shot time
      Firing.lastShotTime[towerEid] = currentTime;
    }

    return world;
  }
}

/**
 * Create a firing system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createFiringSystem(scene: Phaser.Scene) {
  const manager = new FiringSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
    return manager.update(world, delta);
  });
}

