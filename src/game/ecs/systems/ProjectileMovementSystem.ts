import { defineSystem, defineQuery, IWorld } from 'bitecs';
import Phaser from 'phaser';

import { Position, Projectile, Direction } from '../components';

/**
 * ProjectileMovementSystem handles straight-line movement for projectiles
 * 
 * Responsibilities:
 * - Moves projectiles in a straight line based on their Direction component
 * - Uses fast speed to ensure projectiles hit their targets
 * - Only handles movement, collision detection is handled elsewhere
 * 
 * Note: This system processes all entities with Projectile, Position, and Direction components.
 * The Direction component stores velocity vector (vx, vy) in pixels per millisecond.
 */
export const ProjectileMovementSystem = defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
  // Query for all projectiles (entities with Projectile, Position, and Direction components)
  const projectileQuery = defineQuery([Projectile, Position, Direction]);
  const projectiles = projectileQuery(world);

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
});

