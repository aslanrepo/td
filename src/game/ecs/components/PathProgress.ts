import { defineComponent, Types } from 'bitecs';

const PathProgressInternal = defineComponent({
  progress: Types.f32,
});

// Explicit type for SoA arrays
export type PathProgressType = {
  progress: Float32Array;
};

export const PathProgress: PathProgressType = PathProgressInternal as PathProgressType;
