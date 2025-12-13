import { defineSystem, defineQuery, IWorld } from 'bitecs';
import Phaser from 'phaser';

import { Position, Range, Target, Enemy, PathProgress, Tower, NO_TARGET } from '../components';

/**
 * TargetSystemManager handles tower targeting logic for ECS entities
 * Uses a manager pattern similar to RenderSystemManager for consistency
 * Automatically finds and targets enemies within range
 */
class TargetSystemManager {
  private initialized = false;
  
  private readonly DEBUG = true; // Toggle for debug logs
  
  // Pre-defined queries for performance
  private readonly towerQuery = defineQuery([Tower, Position, Range, Target]);
  private readonly enemyQuery = defineQuery([Enemy, Position, PathProgress]);

  /**
   * Initialize the targeting system for a specific scene
   * Sets up event listeners and prepares the system for use
   */
  initializeForScene(_scene: Phaser.Scene) {
    this.initialized = true;
  }

  /**
   * Main update method called by the ECS system
   * Handles tower targeting logic for all towers
   * @param world - ECS world instance
   * @returns Updated world
   */
  update(world: IWorld): IWorld {
    if (!this.initialized) return world;

    // Collect active enemies
    const enemies = this.enemyQuery(world);

    // Sort enemies by progress (descending - closest to exit first)
    const sortedEnemies = enemies.slice().sort((a, b) => 
      PathProgress.currentWaypoint[b] - PathProgress.currentWaypoint[a]
    );

    // Process each tower
    this.towerQuery(world).forEach((towerEid) => {
      this.processTowerTargeting(towerEid, sortedEnemies);
    });

    return world;
  }

  /**
   * Process targeting logic for a single tower
   * @param towerEid - Tower entity ID
   * @param sortedEnemies - Array of enemy entity IDs sorted by progress
   */
  private processTowerTargeting(towerEid: number, sortedEnemies: number[]) {
    const tx = Position.x[towerEid];
    const ty = Position.y[towerEid];
    const range = Range.value[towerEid];
    const prevTarget = Target.eid[towerEid]; // For logging

    let bestTarget: number | null = null;

    // Search for first suitable enemy in range (enemies are already sorted by progress descending)
    for (const enemyEid of sortedEnemies) {
      const ex = Position.x[enemyEid];
      const ey = Position.y[enemyEid];
      const dist = Math.hypot(ex - tx, ey - ty); // Distance calculation

      if (dist <= range) {
        bestTarget = enemyEid;
        break; // Take first suitable enemy (already sorted by progress)
      }
    }

    // Update target (NO_TARGET = no target, idle state)
    Target.eid[towerEid] = bestTarget !== null ? bestTarget : NO_TARGET;

    // Debug logging
    if (this.DEBUG) {
      if (bestTarget !== null && prevTarget !== bestTarget) {
        console.log(`Tower ID: ${towerEid} targeting Enemy ID: ${bestTarget}`);
      } else if (bestTarget === null && prevTarget !== NO_TARGET) {
        console.log(`Tower ID: ${towerEid} lost target, now idle`);
      }
    }
  }
}

/**
 * Create a targeting system for the given scene
 * Each scene gets its own manager instance for proper state management
 * @param scene - Phaser scene instance
 * @returns ECS system function
 */
export function createTargetSystem(scene: Phaser.Scene) {
  const manager = new TargetSystemManager();
  manager.initializeForScene(scene);
  
  return defineSystem((world: IWorld) => {
    return manager.update(world);
  });
}
