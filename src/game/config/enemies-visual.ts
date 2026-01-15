/**
 * Enemy visual configuration with TypeScript types
 * Contains size, color, and renderType for all enemy types
 * 
 * renderType values:
 * - 0: Enemy (rendered as circle)
 */

import enemiesVisualConfigRaw from './enemies-visual.json';

/**
 * Raw visual config from JSON (color is string in hex format)
 */
interface EnemyVisualConfigRaw {
  size: number;
  color: string; // Hex string like "0xff0000"
  renderType: number; // Will be 0, but JSON infers as number
}

/**
 * Visual configuration for a single enemy
 */
export interface EnemyVisualConfig {
  size: number;
  color: number; // Parsed hex number
  renderType: 0; // Always 0 for enemies
}

/**
 * Visual configuration for all enemies
 */
export interface EnemiesVisualConfig {
  enemies: {
    [enemyId: string]: EnemyVisualConfig;
  };
}

/**
 * Convert hex string to number
 * @param hexString - Hex string (e.g., "0xff0000")
 * @returns Number representation
 */
function hexStringToNumber(hexString: string): number {
  return parseInt(hexString.replace('0x', ''), 16);
}

/**
 * Transform raw config to typed config with parsed colors
 */
function transformVisualConfig(
  raw: { enemies: { [key: string]: EnemyVisualConfigRaw } }
): EnemiesVisualConfig {
  const transformed: EnemiesVisualConfig['enemies'] = {};
  
  for (const [id, config] of Object.entries(raw.enemies)) {
    transformed[id] = {
      size: config.size,
      color: hexStringToNumber(config.color),
      renderType: 0 as const, // Always 0 for enemies
    };
  }
  
  return { enemies: transformed };
}

// Typed constant from imported JSON with parsed hex colors
export const enemiesVisualData: EnemiesVisualConfig = transformVisualConfig(enemiesVisualConfigRaw);

/**
 * Get visual configuration for an enemy by ID
 * @param id - Enemy ID (e.g., "red", "moab", "ddt")
 * @returns Enemy visual config or undefined if not found
 */
export function getEnemyVisualById(id: string): EnemyVisualConfig | undefined {
  return enemiesVisualData.enemies[id];
}
