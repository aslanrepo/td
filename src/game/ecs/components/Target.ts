import { defineComponent, Types } from 'bitecs';

// Constant for "no target" - using max Uint32 value since entity IDs start from 0
export const NO_TARGET = 0xFFFFFFFF;

const TargetInternal = defineComponent({
  eid: Types.ui32, // NO_TARGET (0xFFFFFFFF) = no target, 0..n = enemy entity ID
});

// Explicit type for SoA arrays
export type TargetType = {
  eid: Uint32Array;
};

export const Target: TargetType = TargetInternal as TargetType;
