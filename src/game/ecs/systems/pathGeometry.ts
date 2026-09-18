export interface Point {
  x: number;
  y: number;
}

/**
 * Shifts every waypoint sideways by `offset` pixels, producing a lane that runs
 * next to the original path. The shift at each waypoint is perpendicular to the
 * path direction there: the direction to the next point at the start, from the
 * previous point at the end, and the average of both in between so corners are
 * shifted along their bisector instead of one leg only.
 *
 * Positive and negative offsets give lanes on opposite sides. Pure function, no
 * Phaser dependency, so it can be tested without a canvas.
 */
export function offsetWaypoints(waypoints: readonly Point[], offset: number): Point[] {
  if (waypoints.length < 2) {
    throw new Error('offsetWaypoints needs at least two waypoints');
  }

  return waypoints.map((point, i) => {
    const normal = perpendicular(tangentAt(waypoints, i));
    return { x: point.x + normal.x * offset, y: point.y + normal.y * offset };
  });
}

function tangentAt(waypoints: readonly Point[], i: number): Point {
  const last = waypoints.length - 1;
  if (i === 0) return direction(waypoints[0], waypoints[1]);
  if (i === last) return direction(waypoints[last - 1], waypoints[last]);

  const incoming = direction(waypoints[i - 1], waypoints[i]);
  const outgoing = direction(waypoints[i], waypoints[i + 1]);
  const averaged = normalize({ x: incoming.x + outgoing.x, y: incoming.y + outgoing.y });

  // On a U-turn the two directions cancel out; keep the incoming one rather than a zero vector.
  return averaged.x === 0 && averaged.y === 0 ? incoming : averaged;
}

function direction(from: Point, to: Point): Point {
  return normalize({ x: to.x - from.x, y: to.y - from.y });
}

function normalize(v: Point): Point {
  const length = Math.hypot(v.x, v.y);
  return length === 0 ? { x: 0, y: 0 } : { x: v.x / length, y: v.y / length };
}

function perpendicular(v: Point): Point {
  return { x: -v.y, y: v.x };
}
