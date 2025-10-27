import { defineSystem, defineQuery, IWorld } from 'bitecs';

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

export const PathMovementSystem = defineSystem((world: IWorld, scene: Phaser.Scene, delta: number) => {
  const movementQuery = defineQuery([Position, Velocity, PathProgress, Renderable]);
  const entities = movementQuery(world);

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
        const gameWorld = scene.registry.get('gameWorld') as GameWorld;
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
});

// Export waypoints for use in other systems
export { WAYPOINTS };
