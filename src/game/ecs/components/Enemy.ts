import { defineComponent } from 'bitecs';

// Marker component for enemy identification
// No additional data fields needed - just a flag
const EnemyInternal = defineComponent({});

// Explicit type for SoA arrays (empty for marker component)
export type EnemyType = {};

export const Enemy: EnemyType = EnemyInternal as EnemyType;
