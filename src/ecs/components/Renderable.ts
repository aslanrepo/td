import { defineComponent, Types } from 'bitecs';

const RenderableInternal = defineComponent({
  type: Types.ui8,      // 0: enemy, 1: tower
  color: Types.ui32,
  size: Types.f32,
});

// Explicit type
export type RenderableType = {
  type: Uint8Array;
  color: Uint32Array;
  size: Float32Array;
};

export const Renderable: RenderableType = RenderableInternal as RenderableType;