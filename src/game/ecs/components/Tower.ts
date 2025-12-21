import { defineComponent, Types } from 'bitecs';

const TowerInternal = defineComponent({
  type: Types.ui8, // 0 — dart, 1 — cannon, 2 — ice
  damage: Types.f32, // Damage dealt by projectiles from this tower
  projectileSpeed: Types.f32, // Projectile speed in pixels per second
});

// Explicit type for SoA arrays
export type TowerType = {
  type: Uint8Array;
  damage: Float32Array;
  projectileSpeed: Float32Array;
};

export const Tower: TowerType = TowerInternal as TowerType;
