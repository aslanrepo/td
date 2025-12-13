import { addComponent } from 'bitecs';
import { Scene } from 'phaser';

import { GameWorld } from '../ecs';
import { Position, Renderable, Velocity, PathProgress, Enemy, Tower, Range, Target, NO_TARGET } from '../ecs';
import { WAYPOINTS } from '../ecs/systems/PathMovementSystem';
import { EventBus } from '../EventBus';

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

        // Draw waypoint path for debugging
        this.drawWaypointPath();

        // Spawn multiple test enemies
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy(1);
        }

        // Create test tower
        this.createTower(768, 383, 0); // Dart tower at specified coordinates

        this.createBackButton(this.scale.width, this.scale.height);

        // Создаём текстовую метку для координат
        this.coordsLabel = this.add.text(1060, 1060, '(x, y)', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        // Add click event listener for point creation
        this.input.on('pointerdown', this.createPointAtClick, this);

        // Emit the current scene ready event
        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Create back button to return to menu
     */
    private createBackButton(width: number, height: number): void {
        console.log('=== CREATING BACK BUTTON ===');
        console.log('Button position:', width / 2, height / 2 + 100);

        const buttonWidth = 150;
        const buttonHeight = 50;
        const buttonX = width / 2;
        const buttonY = height / 2 + 100;

        // Create button using Container for better event handling
        const buttonContainer = this.add.container(buttonX, buttonY);

        // Create button background using Graphics (vector-based)
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(this.hexToNumber('#3390EC'));
        buttonBg.fillRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            10
        );

        // Add button border
        buttonBg.lineStyle(2, 0xffffff);
        buttonBg.strokeRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            10
        );

        // Create button text
        const buttonText = this.add.text(0, 0, 'BACK2 TO MENU', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // Add both to container
        buttonContainer.add([buttonBg, buttonText]);

        // Make container interactive with explicit hit area
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        );
        console.log('Button container created and set as interactive with hit area');

        // Add multiple event listeners for debugging
        buttonContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            console.log('Button clicked! pointerdown event triggered at:', pointer.x, pointer.y);
            this.scene.start('MenuScene');
        });

        buttonContainer.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            console.log('Button pointerup event triggered at:', pointer.x, pointer.y);
        });

        // Add click event as alternative
        buttonContainer.on('click', (pointer: Phaser.Input.Pointer) => {
            console.log('Button click event triggered at:', pointer.x, pointer.y);
        });

        buttonContainer.on('pointerover', () => {
            console.log('Button hover started');
            buttonBg.clear();
            buttonBg.fillStyle(0xffffff);
            buttonBg.fillRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                10
            );
            buttonBg.lineStyle(2, this.hexToNumber('#3390EC'));
            buttonBg.strokeRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                10
            );
            buttonText.setColor('#3390EC');
        });

        buttonContainer.on('pointerout', () => {
            console.log('Button hover ended');
            buttonBg.clear();
            buttonBg.fillStyle(this.hexToNumber('#3390EC'));
            buttonBg.fillRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                10
            );
            buttonBg.lineStyle(2, 0xffffff);
            buttonBg.strokeRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                10
            );
            buttonText.setColor('#ffffff');
        });

        // Add button animation
        this.tweens.add({
            targets: buttonContainer,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Spawn enemy entity with ECS components
     */
    private spawnEnemy(lvl: number) {
        const eid = this.ecsWorld.createEntity();

        // Add components to entity
        addComponent(this.ecsWorld.world, Position, eid);
        addComponent(this.ecsWorld.world, Renderable, eid);
        addComponent(this.ecsWorld.world, Velocity, eid);
        addComponent(this.ecsWorld.world, PathProgress, eid);
        addComponent(this.ecsWorld.world, Enemy, eid);

        // Set component values
        Position.x[eid] = WAYPOINTS[0].x;  // Start at first waypoint
        Position.y[eid] = WAYPOINTS[0].y;
        Renderable.type[eid] = 0;  // Enemy
        Renderable.color[eid] = lvl === 1 ? 0xff0000 : 0x0000ff; // Red/blue
        Renderable.size[eid] = 25; // Smaller size for better movement visualization
        Velocity.speed[eid] = 100; // 1 unit per second
        PathProgress.currentWaypoint[eid] = 0; // Start at first waypoint

        console.log(`Spawned enemy ${eid} at (${Position.x[eid]}, ${Position.y[eid]})`);
    }

    /**
     * Create tower entity with ECS components
     */
    private createTower(x: number, y: number, towerType: number) {
        const eid = this.ecsWorld.createEntity();

        // Add components to entity
        addComponent(this.ecsWorld.world, Position, eid);
        addComponent(this.ecsWorld.world, Renderable, eid);
        addComponent(this.ecsWorld.world, Tower, eid);
        addComponent(this.ecsWorld.world, Range, eid);
        addComponent(this.ecsWorld.world, Target, eid);

        // Set component values
        Position.x[eid] = x;
        Position.y[eid] = y;
        Tower.type[eid] = towerType; // 0 = dart, 1 = cannon, 2 = ice
        
        // Set range based on tower type
        const rangeValues = [50, 50, 50]; // dart, cannon, ice
        Range.value[eid] = rangeValues[towerType] || 50;
        
        Target.eid[eid] = NO_TARGET; // No target initially
        
        // Set visual properties
        Renderable.type[eid] = 1; // Tower type for rendering
        Renderable.color[eid] = towerType === 0 ? 0x00ff00 : towerType === 1 ? 0xff8800 : 0x0088ff; // Green/Orange/Blue
        Renderable.size[eid] = 30; // Tower size

        console.log(`Created tower ${eid} at (${x}, ${y}) with type ${towerType} and range ${Range.value[eid]}`);
    }

    /**
     * Draw waypoint path for debugging
     */
    private drawWaypointPath(): void {
        const pathGraphics = this.add.graphics();

        // Set line style for the path
        pathGraphics.lineStyle(4, 0x666666); // Gray line, 2px width

        // Draw lines between waypoints
        for (let i = 0; i < WAYPOINTS.length - 1; i++) {
            const start = WAYPOINTS[i];
            const end = WAYPOINTS[i + 1];
            pathGraphics.lineBetween(
                start.x,
                start.y,
                end.x,
                end.y
            );
        }

        // Draw waypoint markers
        pathGraphics.fillStyle(0x888888);
        WAYPOINTS.forEach((waypoint, index) => {
            pathGraphics.fillCircle(waypoint.x, waypoint.y, 3);

            // Add waypoint labels
            this.add.text(waypoint.x, waypoint.y, `${index}`, {
                fontSize: '30px',
                color: '#ffffff'
            });
        });
    }

    /**
     * Create point at click location with coordinates label
     */
    private createPointAtClick(pointer: Phaser.Input.Pointer): void {
        // Don't create point if clicking on the back button
        if (pointer.x >= this.scale.width / 2 - 75 && pointer.x <= this.scale.width / 2 + 75 &&
            pointer.y >= this.scale.height / 2 + 75 && pointer.y <= this.scale.height / 2 + 125) {
            return;
        }

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

    /**
     * Convert hex color string to number
     */
    private hexToNumber(hex: string): number {
        return parseInt(hex.replace('#', ''), 16);
    }
}

