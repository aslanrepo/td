import { defineComponent, Types } from 'bitecs';

const PositionInternal = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

// Явная типизация: SoA с arrays
export type PositionType = {
  x: Float32Array;
  y: Float32Array;
};

export const Position: PositionType = PositionInternal as PositionType;