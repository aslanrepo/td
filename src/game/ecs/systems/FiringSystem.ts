import { defineSystem, defineQuery, IWorld, addComponent } from 'bitecs';
import Phaser from 'phaser';

import { Position, Target, Firing, Projectile, Renderable, Tower, Enemy, NO_TARGET, Direction } from '../components';
import { GameWorld } from '../World';

/**
 * Constant projectile speed (high value for fast, nearly instant travel)
 * This ensures projectiles move in a straight line at constant speed
 * Fast speed guarantees projectiles hit their targets without needing to track moving enemies
 */
const PROJECTILE_SPEED = 8000; // pixels per second (fast enough to hit moving targets)

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
 * FiringSystem handles shooting logic for towers
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
export const FiringSystem = defineSystem((world: IWorld, scene: Phaser.Scene, delta: number) => {
  // Query for towers that can shoot (have Tower, Position, Target, and Firing components)
  const firingTowerQuery = defineQuery([Tower, Position, Target, Firing]);
  const towers = firingTowerQuery(world);

  // Query for enemies to validate targets
  const enemyQuery = defineQuery([Enemy, Position]);
  const enemies = enemyQuery(world);
  
  // Create a Set for fast enemy lookup
  const enemySet = new Set(enemies);

  // Get current game time (in milliseconds)
  const currentTime = scene.time.now;

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

    console.log("projectile fired");

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
    const gameWorld = scene.registry.get('gameWorld') as GameWorld;
    if (!gameWorld) {
      console.warn('FiringSystem: GameWorld not found in scene registry');
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
});

