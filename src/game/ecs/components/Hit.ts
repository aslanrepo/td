import { defineComponent, Types } from 'bitecs';

/**
 * Hit component marks entities that have been hit by projectiles
 * Contains damage amount that will be applied by DamageSystem
 * This is a temporary component that gets removed after damage is applied
 */
const HitInternal = defineComponent({
  damage: Types.f32,  // Damage amount from the hit
});

// Explicit type for SoA arrays
export type HitType = {
  damage: Float32Array;
};

export const Hit: HitType = HitInternal as HitType;

