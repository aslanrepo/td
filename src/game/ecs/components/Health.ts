import { defineComponent, Types } from 'bitecs';

/**
 * Health component for entities that can take damage
 * Contains maximum and current health points
 */
const HealthInternal = defineComponent({
  maxHp: Types.f32,      // Maximum health points
  currentHp: Types.f32,   // Current health points
});

// Explicit type for SoA arrays
export type HealthType = {
  maxHp: Float32Array;
  currentHp: Float32Array;
};

export const Health: HealthType = HealthInternal as HealthType;

