import { defineQuery, defineSystem, IWorld, removeEntity } from 'bitecs';
import Phaser from 'phaser';

import { Enemy, PathIndex, PathProgress, Position, Velocity } from '../components';

import { offsetWaypoints, type Point } from './pathGeometry';

// The route enemies walk, in scene pixels. Hand-placed for the sandbox map.
const WAYPOINTS: Point[] = [
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
  { x: 736, y: 1080 },
];

// Three lanes: the route itself and one copy shifted to each side, so enemies do not walk in single file.
const LANE_OFFSETS = [0, 8, -8];
const LANE_COLORS = [0x808080, 0x6060a0, 0xa06060];
const LANE_WIDTH = 15;
const LANE_DEPTH = 0.5; // above the background, below the enemies

export function createPathFromWaypoints(waypoints: readonly Point[]): Phaser.Curves.Path {
  if (waypoints.length < 2) {
    throw new Error('A path needs at least two waypoints');
  }

  const [first, ...rest] = waypoints;
  const path = new Phaser.Curves.Path(first.x, first.y);
  path.splineTo(rest.map((p) => new Phaser.Math.Vector2(p.x, p.y)));
  return path;
}

/**
 * Moves enemies along their lane. Progress is stored per entity as a fraction of the
 * lane length (0..1), so `Velocity.speed` means pixels per second on every lane.
 * An enemy that reaches the end of its lane is removed from the world; the render
 * system drops its sprite through its exit query.
 */
class PathMovementSystemManager {
  private readonly enemies = defineQuery([Enemy, Position, Velocity, PathProgress, PathIndex]);
  private readonly lanes: Phaser.Curves.Path[];
  private readonly laneLengths: number[];

  constructor(scene: Phaser.Scene) {
    this.lanes = LANE_OFFSETS.map((offset) => createPathFromWaypoints(offsetWaypoints(WAYPOINTS, offset)));
    this.laneLengths = this.lanes.map((lane) => lane.getLength());

    // The spawn code picks a lane for each new enemy from here.
    scene.registry.set('enemyPaths', this.lanes);

    this.draw(scene);
  }

  update(world: IWorld, deltaMs: number): IWorld {
    const deltaSec = deltaMs / 1000;
    const finished: number[] = [];

    for (const eid of this.enemies(world)) {
      const laneIndex = this.laneIndexOf(eid);
      const step = (Velocity.speed[eid] * deltaSec) / this.laneLengths[laneIndex];
      const progress = Math.min(1, PathProgress.progress[eid] + step);

      const point = this.lanes[laneIndex].getPoint(progress);
      Position.x[eid] = point.x;
      Position.y[eid] = point.y;
      PathProgress.progress[eid] = progress;

      if (progress >= 1) finished.push(eid);
    }

    for (const eid of finished) removeEntity(world, eid);

    return world;
  }

  private laneIndexOf(eid: number): number {
    const index = PathIndex.index[eid];
    return index >= 0 && index < this.lanes.length ? index : 0;
  }

  private draw(scene: Phaser.Scene) {
    const graphics = scene.add.graphics().setDepth(LANE_DEPTH);
    this.lanes.forEach((lane, i) => {
      graphics.lineStyle(LANE_WIDTH, LANE_COLORS[i], 1);
      lane.draw(graphics);
    });
  }
}

export function createPathMovementSystem(scene: Phaser.Scene) {
  const manager = new PathMovementSystemManager(scene);
  return defineSystem((world: IWorld, _scene: Phaser.Scene, delta: number) => manager.update(world, delta));
}
