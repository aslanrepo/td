/**
 * Entity configuration for visual properties
 * Contains size, color, and renderType for all entity types
 * 
 * renderType values:
 * - 0: Enemy (rendered as circle)
 * - 1: Tower (rendered as rectangle)
 * - 2: Projectile (rendered as circle)
 */

export const entityConfig = {
  towers: {
    ball: { 
      size: 50, 
      color: 0x00ff00, // Green
      renderType: 1 // Tower type for rendering
    },
    // Future tower types can be added here
    // cannon: { size: 35, color: 0xff8800, renderType: 1 },
    // ice: { size: 30, color: 0x0088ff, renderType: 1 },
  },
  enemies: {
    basic: { 
      size: 20, 
      color: 0xff0000, // Red
      renderType: 0 // Enemy type for rendering
    },
    // Future enemy types can be added here
    // fast: { size: 20, color: 0xff00ff, renderType: 0 },
    // tank: { size: 35, color: 0x0000ff, renderType: 0 },
  },
  projectiles: {
    basic: { 
      size: 10, 
      color: 0xffd700,
      renderType: 2 // Projectile type for rendering
    },
    // Future projectile types can be added here
  }
} as const;

// Type definitions for better TypeScript support
export type TowerType = keyof typeof entityConfig.towers;
export type EnemyType = keyof typeof entityConfig.enemies;
export type ProjectileType = keyof typeof entityConfig.projectiles;

