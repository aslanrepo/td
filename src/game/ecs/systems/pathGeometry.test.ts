import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { offsetWaypoints, type Point } from './pathGeometry.ts';

function assertClose(actual: Point, expected: Point) {
  assert.ok(Math.abs(actual.x - expected.x) < 1e-9 && Math.abs(actual.y - expected.y) < 1e-9, `expected ${JSON.stringify(actual)} to be close to ${JSON.stringify(expected)}`);
}

describe('offsetWaypoints', () => {
  it('shifts a straight path sideways by the offset, on opposite sides for opposite signs', () => {
    const path = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];

    assert.deepEqual(offsetWaypoints(path, 5), [{ x: 0, y: 5 }, { x: 10, y: 5 }, { x: 20, y: 5 }]);
    assert.deepEqual(offsetWaypoints(path, -5), [{ x: 0, y: -5 }, { x: 10, y: -5 }, { x: 20, y: -5 }]);
  });

  it('moves a corner along the bisector of its two legs', () => {
    const path = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];

    const [start, corner, end] = offsetWaypoints(path, 2);

    assert.deepEqual(start, { x: 0, y: 2 });
    assert.deepEqual(end, { x: 8, y: 10 });
    assertClose(corner, { x: 10 - Math.SQRT2, y: Math.SQRT2 });
  });

  it('keeps the incoming direction on a U-turn instead of producing NaN', () => {
    const path = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }];

    const [, turn] = offsetWaypoints(path, 3);

    assert.deepEqual(turn, { x: 10, y: 3 });
  });

  it('leaves the input untouched', () => {
    const path = [{ x: 1, y: 1 }, { x: 4, y: 5 }];
    const copy = structuredClone(path);

    offsetWaypoints(path, 7);

    assert.deepEqual(path, copy);
  });

  it('rejects a path with fewer than two waypoints', () => {
    assert.throws(() => offsetWaypoints([{ x: 0, y: 0 }], 1), /at least two waypoints/);
  });
});
