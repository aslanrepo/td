import { defineComponent, Types } from 'bitecs';

/**
 * Projectile component for entities representing projectiles
 * Contains damage and lifetime attributes
 */
const ProjectileInternal = defineComponent({
  damage: Types.f32,      // Damage dealt on hit
  lifetime: Types.f32,     // Maximum lifetime in milliseconds
  spawnTime: Types.f32,    // Timestamp when projectile was created
});

// Explicit type for SoA arrays
export type ProjectileType = {
  damage: Float32Array;
  lifetime: Float32Array;
  spawnTime: Float32Array;
};

export const Projectile: ProjectileType = ProjectileInternal as ProjectileType;

