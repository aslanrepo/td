import { defineComponent, Types } from 'bitecs';

const PathIndexInternal = defineComponent({
  index: Types.i32,
});

// Explicit type for SoA arrays
export type PathIndexType = {
  index: Int32Array;
};

export const PathIndex: PathIndexType = PathIndexInternal as PathIndexType;
