import { defineComponent, Types } from 'bitecs';

const TowerInternal = defineComponent({
  type: Types.ui8, // 0 — dart, 1 — cannon, 2 — ice
});

// Explicit type for SoA arrays
export type TowerType = {
  type: Uint8Array;
};

export const Tower: TowerType = TowerInternal as TowerType;
