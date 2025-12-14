import { defineComponent, Types } from 'bitecs';

/**
 * Firing component for towers that can shoot projectiles
 * Contains shooting-specific attributes: fire interval and last shot time
 */
const FiringInternal = defineComponent({
  fireInterval: Types.f32, // Time in milliseconds between shots
  lastShotTime: Types.f32,  // Timestamp of last shot (in milliseconds)
});

// Explicit type for SoA arrays
export type FiringType = {
  fireInterval: Float32Array;
  lastShotTime: Float32Array;
};

export const Firing: FiringType = FiringInternal as FiringType;

