import { defineComponent, Types } from 'bitecs';

const RangeInternal = defineComponent({
  value: Types.f32, // Attack range radius
});

// Explicit type for SoA arrays
export type RangeType = {
  value: Float32Array;
};

export const Range: RangeType = RangeInternal as RangeType;
