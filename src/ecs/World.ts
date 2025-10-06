import { createWorld, registerComponent, IWorld, addEntity, removeEntity } from 'bitecs';
import { RenderSystem } from './systems';
import { Position, Renderable } from './components';

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

        // Register systems
        this.registerSystem(RenderSystem, 100); // Render last
        // Later: this.registerSystem(MovementSystem, 10);
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

    create() {
        return addEntity(this.world);
    }

    destroy(eid: number) {
        removeEntity(this.world, eid);
    }
}
