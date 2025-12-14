import { defineComponent, Types } from 'bitecs';

/**
 * Direction component for entities that move in a specific direction
 * Used primarily for projectiles that move in a straight line
 * Stores normalized direction vector (vx, vy) and speed
 */
const DirectionInternal = defineComponent({
  vx: Types.f32, // X component of velocity vector (pixels per millisecond)
  vy: Types.f32, // Y component of velocity vector (pixels per millisecond)
});

// Explicit type for SoA arrays
export type DirectionType = {
  vx: Float32Array;
  vy: Float32Array;
};

export const Direction: DirectionType = DirectionInternal as DirectionType;

