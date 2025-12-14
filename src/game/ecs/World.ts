import { createWorld, registerComponent, IWorld, addEntity, removeEntity, getAllEntities } from 'bitecs';

import { Position, Renderable, Velocity, PathProgress, Tower, Range, Enemy, Target, Firing, Projectile, Direction } from './components';
import { PathMovementSystem, ProjectileMovementSystem, FiringSystem } from './systems';
import { createRenderSystem } from './systems/RenderSystemManager';
import { createTargetSystem } from './systems/TargetSystemManager';

/**
 * GameWorld extends BitecsWorld with Phaser scene integration
 * Manages ECS systems and provides scene reference
 */
export class GameWorld {
    public world: IWorld;
    public scene: Phaser.Scene;
    private systems: Array<{ system: any; priority: number }> = [];

    constructor(scene: Phaser.Scene) {
        this.world = createWorld();
        this.scene = scene;

        // Register components
        registerComponent(this.world, Position);
        registerComponent(this.world, Renderable);
        registerComponent(this.world, Velocity);
        registerComponent(this.world, PathProgress);
        registerComponent(this.world, Tower);
        registerComponent(this.world, Range);
        registerComponent(this.world, Enemy);
        registerComponent(this.world, Target);
        registerComponent(this.world, Firing);
        registerComponent(this.world, Projectile);
        registerComponent(this.world, Direction);

        // Register systems
        this.registerSystem(PathMovementSystem, 10); // Enemy movement first
        this.registerSystem(createTargetSystem(scene), 50); // Targeting after movement
        this.registerSystem(FiringSystem, 60); // Firing after targeting
        this.registerSystem(ProjectileMovementSystem, 65); // Projectile movement after creation
        this.registerSystem(createRenderSystem(scene), 100); // Render last
    }

    registerSystem(system: any, priority: number) {
        this.systems.push({ system, priority });
        this.systems.sort((a, b) => a.priority - b.priority);
    }

    execute(_delta: number) {
        // Execute systems in priority order
        for (const { system } of this.systems) {
            system(this.world, this.scene, _delta);
        }
    }

    createEntity() {
        return addEntity(this.world);
    }

    destroyEntity(eid: number) {
        removeEntity(this.world, eid);
    }

    cleanAllEntities() {
        getAllEntities(this.world).forEach(eid => {
            removeEntity(this.world, eid);
        });
    }
}
