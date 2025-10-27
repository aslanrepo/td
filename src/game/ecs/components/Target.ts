import { defineComponent, Types } from 'bitecs';

const TargetInternal = defineComponent({
  eid: Types.ui32, // 0 = no target, >0 = enemy entity ID
});

// Explicit type for SoA arrays
export type TargetType = {
  eid: Uint32Array;
};

export const Target: TargetType = TargetInternal as TargetType;
