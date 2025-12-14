import { defineSystem, defineQuery, IWorld } from 'bitecs';
import Phaser from 'phaser';

import { Position, Velocity, PathProgress, Renderable } from '../components';
import { GameWorld } from '../World';

// Waypoints defining the path enemies will follow
// Based on user-created points for custom path
const WAYPOINTS = [
  { x: 0, y: 401 },
  { x: 753, y: 420 },
  { x: 745, y: 180 },
  { x: 485, y: 172 },
  { x: 494, y: 818 },
  { x: 235, y: 813 },
  { x: 229, y: 646 },
  { x: 957, y: 600 },
  { x: 949, y: 357 },
  { x: 1113, y: 355 },
  { x: 1115, y: 805 },
  { x: 736, y: 794 },
  { x: 736, y: 1080 }
];

const THRESHOLD = 5; // Distance threshold to consider waypoint reached

/**
 * PathMovementSystemManager handles enemy movement along predefined paths
 * Uses a manager pattern similar to RenderSystemManager for consistency
 * 
 * Responsibilities:
 * - Moves enemies along waypoint-based paths
 * - Tracks progress through waypoints
 * - Removes enemies that reach the end of the path
 */
class PathMovementSystemManager {
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly movementQuery = defineQuery([Position, Velocity, PathProgress, Renderable]);

  /**
   * Initialize the path movement system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles movement for all enemies along their paths
   * @param world - ECS world instance
   * @param delta - Time delta in milliseconds
   * @returns Updated world
   */
  update(world: IWorld, delta: number): IWorld {
    if (!this.initialized || !this.scene) return world;

    const entities = this.movementQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Only process enemy entities (type 0)
      if (Renderable.type[eid] !== 0) continue;

      const posX = Position.x[eid];
      const posY = Position.y[eid];
      const speed = Velocity.speed[eid];
      let currentWaypoint = PathProgress.currentWaypoint[eid];

      // Get target waypoint
      const target = WAYPOINTS[currentWaypoint];
      if (!target) continue;

      // Calculate distance to target
      const dx = target.x - posX;
      const dy = target.y - posY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if we've reached the current waypoint
      if (dist < THRESHOLD) {
        currentWaypoint++;
        PathProgress.currentWaypoint[eid] = currentWaypoint;

        // If we've reached the end of the path, remove the entity
        if (currentWaypoint >= WAYPOINTS.length) {
          console.log(`Enemy ${eid} reached the end of the path`);
          // Get the GameWorld instance from the scene registry
          const gameWorld = this.scene.registry.get('gameWorld') as GameWorld;
          if (gameWorld) {
            gameWorld.destroyEntity(eid);
          }
          continue;
        }
      } else {
        // Move towards the target waypoint
        const deltaSec = delta / 1000;
        const dirX = dx / dist;
        const dirY = dy / dist;
        Position.x[eid] += dirX * speed * deltaSec;
        Position.y[eid] += dirY * speed * deltaSec;
      }
    }

    return world;
  }
}

/**
 * Create a path movement system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createPathMovementSystem(scene: Phaser.Scene) {
  const manager = new PathMovementSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => {
    return manager.update(world, delta);
  });
}

// Export waypoints for use in other systems
export { WAYPOINTS };
