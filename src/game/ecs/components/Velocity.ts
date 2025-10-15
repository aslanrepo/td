import { defineComponent, Types } from 'bitecs';

const VelocityInternal = defineComponent({
  speed: Types.f32,
});

// Explicit type for SoA arrays
export type VelocityType = {
  speed: Float32Array;
};

export const Velocity: VelocityType = VelocityInternal as VelocityType;
