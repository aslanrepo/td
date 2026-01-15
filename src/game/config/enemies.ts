/**
 * Enemy game data configuration with TypeScript types
 * Contains game mechanics data: hp, speed, immunities, properties, children
 */

import enemiesConfig from './enemies.json';

/**
 * Child enemy that spawns when parent enemy loses a layer or dies
 */
export interface EnemyChild {
  id: string;
  count: number;
}

/**
 * Enemy class types
 */
export type EnemyClass = 'basic' | 'special' | 'moab' | 'special-moab';

/**
 * Enemy configuration with game mechanics data
 * Note: childrenOnDeath is excluded from this interface
 */
export interface EnemyConfig {
  id: string;
  class: EnemyClass;
  hp: number;
  speed: number;
  immunities: string[];
  properties: string[];
  children: EnemyChild[];
}

/**
 * Enemies configuration containing all enemy types
 */
export interface EnemiesConfig {
  enemies: EnemyConfig[];
}

// Typed constant from imported JSON
// TypeScript will infer the type, but we need to explicitly exclude childrenOnDeath
export const enemiesData: EnemiesConfig = enemiesConfig as EnemiesConfig;

/**
 * Get enemy configuration by ID
 * @param id - Enemy ID (e.g., "red", "moab", "ddt")
 * @returns Enemy config or undefined if not found
 */
export function getEnemyById(id: string): EnemyConfig | undefined {
  return enemiesData.enemies.find(enemy => enemy.id === id);
}

/**
 * Get all enemies of a specific class
 * @param className - Enemy class ("basic", "special", "moab", "special-moab")
 * @returns Array of enemy configs matching the class
 */
export function getEnemiesByClass(className: EnemyClass): EnemyConfig[] {
  return enemiesData.enemies.filter(enemy => enemy.class === className);
}
