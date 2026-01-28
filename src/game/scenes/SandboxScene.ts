import { addComponent, defineQuery } from 'bitecs';
import { Scene } from 'phaser';

import { GameWorld } from '../ecs';
import { Position, Renderable, Velocity, PathProgress, PathIndex, Enemy, Tower, Range, Target, Firing, NO_TARGET, Health } from '../ecs';
import { EventBus } from '../EventBus';
import { entityVisualConfig, TowerType } from '../config/entityConfig';
import { getEnemyById } from '../config/enemies';
import { getEnemyVisualById } from '../config/enemies-visual';

/**
 * Sandbox Scene - Development and testing environment
 * Implements ECS-like architecture with Phaser components
 * Uses vector graphics and dynamic Telegram theming
 */
export class SandboxScene extends Scene {
    private ecsWorld!: GameWorld;
    coordsLabel: Phaser.GameObjects.Text;
    pointer: Phaser.Input.Pointer;
    private createdPoints: Phaser.GameObjects.Container[] = [];

    // Tower deletion tracking
    private pointerDownTime: number = 0;
    private pointerDownPosition: { x: number; y: number } | null = null;
    private holdTimer: Phaser.Time.TimerEvent | null = null;
    private towerQuery = defineQuery([Tower, Position, Renderable]);

    // Auto-spawn settings for performance testing
    private autoSpawnTimer: Phaser.Time.TimerEvent | null = null;
    private autoSpawnEnabled: boolean = false; // Enable auto-spawn by default for testing
    private autoSpawnCount: number = 150; // Number of enemies to spawn per second
    private autoSpawnEnemyType: string = 'blue'; // Enemy type to auto-spawn

    constructor() {
        super({ key: 'SandboxScene' });
    }

    /**
     * Initialize scene with Telegram service
     */
    public init(): void {
        this.events.on('shutdown', this.shutdown, this);
        console.log('=== INITIALIZING SANDBOX SCENE ===');
    }

    override update(_time: number, delta: number): void {
        // Обновляем текст с координатами (округляем для читаемости)
        this.coordsLabel.setText(
            `(x: ${Math.round(this.pointer.x)}, y: ${Math.round(this.pointer.y)})`
        );
        this.ecsWorld.execute(delta);
    }

    public shutdown(): void {
        console.log('=== SHUTTING DOWN SANDBOX SCENE ===');
        this.ecsWorld.cleanAllEntities();
        // Clean up created points
        this.createdPoints.forEach(point => point.destroy());
        this.createdPoints = [];

        // Clean up hold timer if active
        if (this.holdTimer) {
            this.holdTimer.destroy();
            this.holdTimer = null;
        }

        // Clean up auto-spawn timer if active
        if (this.autoSpawnTimer) {
            this.autoSpawnTimer.destroy();
            this.autoSpawnTimer = null;
        }
    }

    /**
     * Create sandbox scene elements
     */
    public create(): void {

        // Получаем активный указатель
        this.pointer = this.input.activePointer;
        console.log('=== CREATING SANDBOX SCENE ===');
        // Initialize ECS world
        this.ecsWorld = new GameWorld(this);

        // Register GameWorld in scene registry for system access
        this.registry.set('gameWorld', this.ecsWorld);

        // Фон: простая зеленая лужайка (прямоугольник)
        const bg = this.add.graphics();
        bg.fillStyle(0x228B22); // Зеленый
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Path visualization is now handled by PathMovementSystem

        // Создаём текстовую метку для координат
        this.coordsLabel = this.add.text(1060, 1060, '(x, y)', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        // Add pointer event listeners for point creation and tower deletion
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointerup', this.handlePointerUp, this);

        // Emit the current scene ready event
        EventBus.emit('current-scene-ready', this);

        // Start auto-spawn timer for performance testing
        this.startAutoSpawn();
    }

    /**
     * Place a tower from the React HUD into the game world.
     * This is a narrow, validated API surface so UI can't accidentally destabilize the scene.
     */
    public placeTowerFromHud(
        x: number,
        y: number,
        stats: { damage: number; fireInterval: number; projectileSpeed: number; range: number }
    ): void {
        if (!this.ecsWorld) {
            return;
        }

        const safeX = this.clampNumber(x, 0, this.scale.width, 0);
        const safeY = this.clampNumber(y, 0, this.scale.height, 0);

        const damage = this.clampNumber(stats?.damage, 0, 1_000_000, 10);
        const fireInterval = this.clampNumber(stats?.fireInterval, 50, 60_000, 1000);
        const projectileSpeed = this.clampNumber(stats?.projectileSpeed, 1, 100_000, 1500);
        const range = this.clampNumber(stats?.range, 1, 5000, 150);

        this.createTower(safeX, safeY, 'basic', { damage, fireInterval, projectileSpeed, range });
    }

    /**
     * Spawn a custom enemy using numeric parameters from the React HUD.
     * Visuals use the existing "red" enemy style (matches the previous Phaser HUD behavior).
     */
    public spawnCustomEnemyFromHud(stats: { hp: number; speed: number }): void {
        if (!this.ecsWorld) {
            return;
        }

        const hp = this.clampNumber(stats?.hp, 1, 10_000_000, 100);
        const speed = this.clampNumber(stats?.speed, 1, 100_000, 100);

        const visual = getEnemyVisualById('red') ?? getEnemyVisualById('blue');
        if (!visual) {
            console.warn('Enemy visual config not found for custom enemy.');
            return;
        }

        this.spawnEnemy({
            hp,
            speed,
            renderType: visual.renderType,
            color: visual.color,
            size: visual.size,
        });
    }

    /**
     * Spawn a preset enemy by ID (same data source as enemies config JSON).
     */
    public spawnPresetEnemyFromHud(enemyId: string): void {
        if (!this.ecsWorld) {
            return;
        }

        const enemyConfig = getEnemyById(enemyId);
        const visualConfig = getEnemyVisualById(enemyId);

        if (!enemyConfig) {
            console.warn(`Enemy config not found for ID: ${enemyId}`);
            return;
        }

        if (!visualConfig) {
            console.warn(`Enemy visual config not found for ID: ${enemyId}`);
            return;
        }

        // Convert speed from config (relative) to pixels per second.
        const baseSpeed = 100;
        const speed = enemyConfig.speed * baseSpeed;

        this.spawnEnemy({
            hp: enemyConfig.hp,
            speed,
            renderType: visualConfig.renderType,
            color: visualConfig.color,
            size: visualConfig.size,
        });
    }

    /**
     * Return to menu (used by the React HUD).
     */
    public backToMenu(): void {
        this.scene.start('MenuScene');
    }

    private clampNumber(value: unknown, min: number, max: number, fallback: number): number {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) {
            return fallback;
        }
        return Math.max(min, Math.min(max, n));
    }

    /**
     * Spawn enemy entity with ECS components
     * @param options - Enemy configuration options
     * @param options.hp - Health points
     * @param options.speed - Movement speed in pixels per second
     * @param options.renderType - Render type (0 for enemy)
     * @param options.color - Color value
     * @param options.size - Size in pixels
     */
    private spawnEnemy(options: { 
        hp: number; 
        speed: number; 
        renderType: number; 
        color: number; 
        size: number;
    }) {
        const eid = this.ecsWorld.createEntity();

        // Add components to entity
        addComponent(this.ecsWorld.world, Position, eid);
        addComponent(this.ecsWorld.world, Renderable, eid);
        addComponent(this.ecsWorld.world, Velocity, eid);
        addComponent(this.ecsWorld.world, PathProgress, eid);
        addComponent(this.ecsWorld.world, PathIndex, eid);
        addComponent(this.ecsWorld.world, Enemy, eid);
        addComponent(this.ecsWorld.world, Health, eid);

        // Get paths array from registry and select random path
        const paths = this.registry.get('enemyPaths') as Phaser.Curves.Path[];
        let selectedPath: Phaser.Curves.Path | null = null;
        let pathIndex = 0;

        if (paths && paths.length > 0) {
          // Select random path index (0, 1, or 2)
          pathIndex = Math.floor(Math.random() * paths.length);
          selectedPath = paths[pathIndex];
        } else {
          // Fallback to single path for backward compatibility
          selectedPath = this.registry.get('enemyPath') as Phaser.Curves.Path;
          pathIndex = 0;
        }

        // Set starting position based on selected path
        if (selectedPath) {
          const startPoint = selectedPath.getStartPoint();
          Position.x[eid] = startPoint.x;
          Position.y[eid] = startPoint.y;
        } else {
          // Fallback if path not available
          Position.x[eid] = 0;
          Position.y[eid] = 401;
        }

        // Set visual properties
        Renderable.type[eid] = options.renderType;
        Renderable.color[eid] = options.color;
        Renderable.size[eid] = options.size;

        Velocity.speed[eid] = options.speed;
        PathProgress.progress[eid] = 0; // Start at beginning of path
        PathIndex.index[eid] = pathIndex; // Store path index for this enemy

        // Set health values
        Health.maxHp[eid] = options.hp;
        Health.currentHp[eid] = options.hp;

        console.log(`Spawned enemy ${eid} at (${Position.x[eid]}, ${Position.y[eid]}) with ${options.hp} HP and speed ${options.speed}`);
    }

    /**
     * Create tower entity with ECS components
     * @param x - X coordinate for tower position
     * @param y - Y coordinate for tower position
     * @param type - Tower type string (e.g., 'ball')
     * @param options - Tower configuration options
     * @param options.damage - Damage dealt by projectiles (default: 10)
     * @param options.fireInterval - Fire interval in milliseconds (default: 1000)
     * @param options.projectileSpeed - Projectile speed in pixels per second (default: 1500)
     * @param options.range - Attack range in pixels (default: 100)
     */
    private createTower(x: number, y: number, type: TowerType, options: { damage?: number; fireInterval?: number; projectileSpeed?: number; range?: number } = {}) {
        const eid = this.ecsWorld.createEntity();

        // Get visual properties from config
        const towerConfig = entityVisualConfig.towers[type];
        if (!towerConfig) {
            console.error(`Unknown tower type: ${type}`);
            return;
        }

        // Extract options with defaults
        const damage = options.damage ?? 10;
        const projectileSpeed = options.projectileSpeed ?? 1500;
        const fireInterval = options.fireInterval ?? 1000;
        const range = options.range ?? 100;

        // Add components to entity
        addComponent(this.ecsWorld.world, Position, eid);
        addComponent(this.ecsWorld.world, Renderable, eid);
        addComponent(this.ecsWorld.world, Tower, eid);
        addComponent(this.ecsWorld.world, Range, eid);
        addComponent(this.ecsWorld.world, Target, eid);
        addComponent(this.ecsWorld.world, Firing, eid);

        // Set component values
        Position.x[eid] = x;
        Position.y[eid] = y;
        Tower.type[eid] = 0; // Keep numeric type for backward compatibility with existing systems
        Tower.damage[eid] = damage;
        Tower.projectileSpeed[eid] = projectileSpeed;

        // Set range
        Range.value[eid] = range;

        Target.eid[eid] = NO_TARGET; // No target initially

        // Set firing properties
        Firing.fireInterval[eid] = fireInterval;
        Firing.lastShotTime[eid] = 0; // Can fire immediately

        // Set visual properties from config
        Renderable.type[eid] = towerConfig.renderType;
        Renderable.color[eid] = towerConfig.color;
        Renderable.size[eid] = towerConfig.size;

        console.log(`Created tower ${eid} at (${x}, ${y}) with type ${type}, damage ${damage}, fireInterval ${fireInterval}ms, projectileSpeed ${projectileSpeed}, range ${range}`);
    }


    /**
     * Handle pointer down event - start tracking hold time
     */
    private handlePointerDown(pointer: Phaser.Input.Pointer): void {
        // Store pointer down time and position
        this.pointerDownTime = this.time.now;
        this.pointerDownPosition = { x: pointer.x, y: pointer.y };

        // Start timer for 1 second hold to delete tower
        this.holdTimer = this.time.delayedCall(1000, () => {
            this.deleteTowerAtPosition(pointer.x, pointer.y);
            this.holdTimer = null;
        });
    }

    /**
     * Handle pointer up event - check if should create point or cancel deletion
     */
    private handlePointerUp(pointer: Phaser.Input.Pointer): void {
        // Cancel hold timer if still active
        if (this.holdTimer) {
            this.holdTimer.destroy();
            this.holdTimer = null;
        }

        // Check if pointer moved significantly (more than 5 pixels)
        if (this.pointerDownPosition) {
            const dx = Math.abs(pointer.x - this.pointerDownPosition.x);
            const dy = Math.abs(pointer.y - this.pointerDownPosition.y);
            if (dx > 5 || dy > 5) {
                this.pointerDownPosition = null;
                return;
            }
        }

        // If hold time was less than 100ms, create point
        if (this.pointerDownTime > 0) {
            const holdDuration = this.time.now - this.pointerDownTime;
            if (holdDuration < 500) {
                this.createPointAtClick(pointer);
            }
        }

        // Reset tracking
        this.pointerDownTime = 0;
        this.pointerDownPosition = null;
    }

    /**
     * Find and delete tower at the specified position
     */
    private deleteTowerAtPosition(x: number, y: number): void {
        if (!this.ecsWorld) {
            return;
        }

        const towers = this.towerQuery(this.ecsWorld.world);

        // Find tower at click position
        for (const towerEid of towers) {
            const towerX = Position.x[towerEid];
            const towerY = Position.y[towerEid];

            // Get tower size from Renderable component (set from config)
            const towerSize = Renderable.size[towerEid];
            const clickRadius = towerSize / 2; // Half of tower size for click detection

            // Calculate distance from click to tower center
            const distance = Math.hypot(x - towerX, y - towerY);

            if (distance <= clickRadius) {
                // Found tower at this position, delete it
                console.log(`Deleting tower ${towerEid} at (${towerX}, ${towerY})`);
                this.ecsWorld.destroyEntity(towerEid);
                return;
            }
        }
    }

    /**
     * Create point at click location with coordinates label
     */
    private createPointAtClick(pointer: Phaser.Input.Pointer): void {
        const x = Math.round(pointer.x);
        const y = Math.round(pointer.y);

        // Create container for point and label
        const pointContainer = this.add.container(x, y);

        // Create visual point (circle)
        const pointGraphics = this.add.graphics();
        pointGraphics.fillStyle(0xffff00); // Yellow color
        pointGraphics.fillCircle(0, 0, 8);
        pointGraphics.lineStyle(2, 0x000000);
        pointGraphics.strokeCircle(0, 0, 8);

        // Create coordinate label above the point
        const coordText = this.add.text(0, -25, `(${x}, ${y})`, {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        coordText.setOrigin(0.5);

        // Add both to container
        pointContainer.add([pointGraphics, coordText]);

        // Store the point for cleanup
        this.createdPoints.push(pointContainer);

        console.log(`Created point at (${x}, ${y})`);
    }
    // NOTE: The Sandbox HUD was migrated to React. Any Phaser-side HUD (panel/DOMElement UI)
    // should live in the React app and interact with this scene through the public methods above.

    /**
     * Start auto-spawn timer for performance testing
     * Spawns enemies at regular intervals
     */
    private startAutoSpawn(): void {
        if (this.autoSpawnEnabled) {
            // Calculate interval in milliseconds (1000ms / count per second)
            const interval = 1000 / this.autoSpawnCount;
            
            this.autoSpawnTimer = this.time.addEvent({
                delay: interval,
                callback: () => {
                    // Get enemy configuration from config files
                    const enemyConfig = getEnemyById(this.autoSpawnEnemyType);
                    const visualConfig = getEnemyVisualById(this.autoSpawnEnemyType);
                    
                    if (!enemyConfig || !visualConfig) {
                        console.error(`Enemy config not found for ID: ${this.autoSpawnEnemyType}`);
                        return;
                    }
                    
                    // Convert speed from config (relative) to pixels per second
                    const baseSpeed = 100; // Base speed in pixels per second
                    const speed = enemyConfig.speed * baseSpeed;
                    
                    // Spawn enemy with config data
                    this.spawnEnemy({
                        hp: enemyConfig.hp,
                        speed: speed,
                        renderType: visualConfig.renderType,
                        color: visualConfig.color,
                        size: visualConfig.size
                    });
                },
                loop: true
            });

            console.log(`Auto-spawn started: ${this.autoSpawnCount} ${this.autoSpawnEnemyType} enemy/enemies per second`);
        }
    }
}

