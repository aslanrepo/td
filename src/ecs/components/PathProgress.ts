import { defineComponent, Types } from 'bitecs';

const PathProgressInternal = defineComponent({
  currentWaypoint: Types.ui8,
});

// Explicit type for SoA arrays
export type PathProgressType = {
  currentWaypoint: Uint8Array;
};

export const PathProgress: PathProgressType = PathProgressInternal as PathProgressType;
