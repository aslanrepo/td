import { defineSystem, defineQuery, IWorld } from 'bitecs';
import Phaser from 'phaser';

import { Position, Velocity, PathProgress, Renderable, PathIndex } from '../components';
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

/**
 * Creates a smooth Phaser.Curves.Path from waypoints using spline interpolation
 * @param waypoints - Array of waypoint coordinates
 * @returns Phaser.Curves.Path object with smooth curves between waypoints
 */
export function createPathFromWaypoints(waypoints: Array<{ x: number; y: number }>): Phaser.Curves.Path | null {
  if (waypoints.length === 0) return null;

  const path = new Phaser.Curves.Path(waypoints[0].x, waypoints[0].y);

  if (waypoints.length > 1) {
    const points = waypoints.slice(1).map(wp => new Phaser.Math.Vector2(wp.x, wp.y));
    path.splineTo(points);
  }

  return path;
}

/**
 * Creates offset waypoints by shifting them perpendicular to the path direction
 * @param waypoints - Array of waypoint coordinates
 * @param offset - Offset distance in pixels (positive = right, negative = left)
 * @returns Array of offset waypoint coordinates
 */
function createOffsetWaypoints(
  waypoints: Array<{ x: number; y: number }>, 
  offset: number
): Array<{ x: number; y: number }> {
  const offsetWaypoints: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i < waypoints.length; i++) {
    let direction: Phaser.Math.Vector2;
    
    if (i === 0) {
      // First waypoint: use direction to next
      direction = new Phaser.Math.Vector2(
        waypoints[i + 1].x - waypoints[i].x,
        waypoints[i + 1].y - waypoints[i].y
      ).normalize();
    } else if (i === waypoints.length - 1) {
      // Last waypoint: use direction from previous
      direction = new Phaser.Math.Vector2(
        waypoints[i].x - waypoints[i - 1].x,
        waypoints[i].y - waypoints[i - 1].y
      ).normalize();
    } else {
      // Middle waypoints: average direction from previous and to next
      const dirFromPrev = new Phaser.Math.Vector2(
        waypoints[i].x - waypoints[i - 1].x,
        waypoints[i].y - waypoints[i - 1].y
      ).normalize();
      const dirToNext = new Phaser.Math.Vector2(
        waypoints[i + 1].x - waypoints[i].x,
        waypoints[i + 1].y - waypoints[i].y
      ).normalize();
      direction = dirFromPrev.add(dirToNext).normalize();
    }
    
    // Calculate perpendicular (rotate 90° counter-clockwise)
    const perpendicular = new Phaser.Math.Vector2(-direction.y, direction.x);
    
    // Apply offset
    offsetWaypoints.push({
      x: waypoints[i].x + perpendicular.x * offset,
      y: waypoints[i].y + perpendicular.y * offset
    });
  }
  
  return offsetWaypoints;
}

/**
 * PathMovementSystemManager handles enemy movement along predefined paths
 * Uses a manager pattern similar to RenderSystemManager for consistency
 * 
 * Responsibilities:
 * - Moves enemies along smooth curved paths using Phaser.Curves.Path
 * - Tracks progress along the path (0-1)
 * - Removes enemies that reach the end of the path
 */
class PathMovementSystemManager {
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Pre-defined queries for performance
  private readonly movementQuery = defineQuery([Position, Velocity, PathProgress, Renderable, PathIndex]);

  /**
   * Initialize the path movement system for a specific scene
   * Creates multiple parallel paths from waypoints, stores them in registry, and visualizes them
   */
  initializeForScene(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create 3 parallel paths: main (offset=0), right (offset=+8), left (offset=-8)
    const mainPath = createPathFromWaypoints(WAYPOINTS);
    const rightPath = createPathFromWaypoints(createOffsetWaypoints(WAYPOINTS, 8));
    const leftPath = createPathFromWaypoints(createOffsetWaypoints(WAYPOINTS, -8));
    
    if (!mainPath || !rightPath || !leftPath) {
      console.error('Failed to create paths from waypoints');
      this.initialized = false;
      return;
    }
    
    const paths = [mainPath, rightPath, leftPath];
    
    // Store paths array in scene registry for access by other systems
    scene.registry.set('enemyPaths', paths);
    // Also store main path for backward compatibility
    scene.registry.set('enemyPath', mainPath);
    
    // Visualize all 3 paths with different colors
    const pathColors = [0x808080, 0x6060a0, 0xa06060]; // Gray, Blue-gray, Red-gray
    const pathGraphics = scene.add.graphics();
    
    for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
      const path = paths[pathIndex];
      const color = pathColors[pathIndex];
      
      pathGraphics.lineStyle(15, color, 1.0);
      
      // Get points from path
      const pathPoints = path.getPoints();
      if (pathPoints.length > 0) {
        pathGraphics.beginPath();
        pathGraphics.moveTo(pathPoints[0].x, pathPoints[0].y);
        
        for (let i = 1; i < pathPoints.length; i++) {
          pathGraphics.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        
        pathGraphics.strokePath();
      }
    }
    
    pathGraphics.setDepth(0.5); // Render paths above background but below enemies
    pathGraphics.setVisible(true);
    
    console.log('Multiple path visualization created with 3 paths');
    paths.forEach((path, index) => {
      console.log(`Path ${index}: length ${path.getLength()} pixels`);
    });
    
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles movement for all enemies along their individual paths
   * @param world - ECS world instance
   * @param delta - Time delta in milliseconds
   * @returns Updated world
   */
  update(world: IWorld, delta: number): IWorld {
    if (!this.initialized || !this.scene) return world;

    // Get paths array from registry
    const paths = this.scene.registry.get('enemyPaths') as Phaser.Curves.Path[];
    if (!paths || paths.length === 0) {
      console.warn('Enemy paths not found in registry');
      return world;
    }

    const entities = this.movementQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Only process enemy entities (type 0)
      if (Renderable.type[eid] !== 0) continue;

      // Get path for this enemy based on its PathIndex
      const pathIndex = PathIndex.index[eid];
      const validPathIndex = (pathIndex >= 0 && pathIndex < paths.length) ? pathIndex : 0;
      const path = paths[validPathIndex];
      const pathLength = path.getLength();

      const speed = Velocity.speed[eid];
      const deltaSec = delta / 1000;
      let progress = PathProgress.progress[eid];

      // Calculate progress increment based on speed and path length
      const progressIncrement = (speed * deltaSec) / pathLength;
      progress = Math.min(1, progress + progressIncrement);

      // Get position on path based on progress
      const point = path.getPoint(progress);
      Position.x[eid] = point.x;
      Position.y[eid] = point.y;

      // Update progress
      PathProgress.progress[eid] = progress;

      // If enemy reached the end of the path, remove it
      if (progress >= 1) {
        console.log(`Enemy ${eid} reached the end of path ${validPathIndex}`);
        // Get the GameWorld instance from the scene registry
        const gameWorld = this.scene.registry.get('gameWorld') as GameWorld;
        if (gameWorld) {
          gameWorld.destroyEntity(eid);
        }
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

// Export waypoints and path creation function for use in other systems
export { WAYPOINTS };
