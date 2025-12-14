import { defineComponent } from 'bitecs';

/**
 * Dead component marks entities that should be removed
 * Used by DeathSystem to identify entities for cleanup
 * This is a marker component with no data fields
 */
const DeadInternal = defineComponent({});

// Explicit type for SoA arrays (empty for marker component)
export type DeadType = {};

export const Dead: DeadType = DeadInternal as DeadType;

