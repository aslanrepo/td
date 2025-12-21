import { addComponent } from 'bitecs';
import { Scene } from 'phaser';

import { GameWorld } from '../ecs';
import { Position, Renderable, Velocity, PathProgress, Enemy, Tower, Range, Target, Firing, NO_TARGET, Health } from '../ecs';
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
    private sandboxPanel!: Phaser.GameObjects.Container;
    private towerIcon: Phaser.GameObjects.Container | null = null;
    private isDraggingTower = false;

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
        
        // Clean up DOM input elements
        if (this.sandboxPanel) {
            const towerStatsInputs = this.sandboxPanel.getData('towerStatsInputs') as { label: Phaser.GameObjects.Text; input: Phaser.GameObjects.DOMElement }[] | undefined;
            if (towerStatsInputs) {
                towerStatsInputs.forEach(item => {
                    if (item.input) {
                        item.input.destroy();
                    }
                });
            }
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

        // Draw waypoint path for debugging
        this.drawWaypointPath();

        // Create sandbox HUD panel
        this.createSandboxPanel();

        // Spawn multiple test enemies
        for (let i = 0; i < 1; i++) {
            this.spawnEnemy({ lvl: 1 });
        }

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
     * @param options - Enemy configuration options
     * @param options.hp - Health points (default: 100)
     * @param options.speed - Movement speed in pixels per second (default: 100)
     * @param options.lvl - Enemy level for color differentiation (default: 1)
     */
    private spawnEnemy(options: { hp?: number; speed?: number; lvl?: number } = {}) {
        const eid = this.ecsWorld.createEntity();

        // Extract options with defaults
        const hp = options.hp ?? 100;
        const speed = options.speed ?? 100;
        const lvl = options.lvl ?? 1;

        // Add components to entity
        addComponent(this.ecsWorld.world, Position, eid);
        addComponent(this.ecsWorld.world, Renderable, eid);
        addComponent(this.ecsWorld.world, Velocity, eid);
        addComponent(this.ecsWorld.world, PathProgress, eid);
        addComponent(this.ecsWorld.world, Enemy, eid);
        addComponent(this.ecsWorld.world, Health, eid);

        // Set component values
        Position.x[eid] = WAYPOINTS[0].x;  // Start at first waypoint
        Position.y[eid] = WAYPOINTS[0].y;
        Renderable.type[eid] = 0;  // Enemy
        Renderable.color[eid] = lvl === 1 ? 0xff0000 : 0x0000ff; // Red/blue
        Renderable.size[eid] = 25; // Smaller size for better movement visualization
        Velocity.speed[eid] = speed;
        PathProgress.currentWaypoint[eid] = 0; // Start at first waypoint
        
        // Set health values
        Health.maxHp[eid] = hp;
        Health.currentHp[eid] = hp;

        console.log(`Spawned enemy ${eid} at (${Position.x[eid]}, ${Position.y[eid]}) with ${hp} HP and speed ${speed}`);
    }

    /**
     * Create tower entity with ECS components
     * @param x - X coordinate for tower position
     * @param y - Y coordinate for tower position
     * @param options - Tower configuration options
     * @param options.towerType - Tower type: 0 = dart, 1 = cannon, 2 = ice (default: 0)
     * @param options.damage - Damage dealt by projectiles (default: 10)
     * @param options.fireInterval - Fire interval in milliseconds (default: based on tower type)
     * @param options.projectileSpeed - Projectile speed in pixels per second (default: 1500)
     * @param options.range - Attack range in pixels (default: based on tower type)
     */
    private createTower(x: number, y: number, options: { towerType?: number; damage?: number; fireInterval?: number; projectileSpeed?: number; range?: number } = {}) {
        const eid = this.ecsWorld.createEntity();

        // Extract options with defaults
        const towerType = options.towerType ?? 0;
        const damage = options.damage ?? 10;
        const projectileSpeed = options.projectileSpeed ?? 1500;
        
        const fireInterval = options.fireInterval ?? 1000
        
        const range = options.range ?? 100

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
        Tower.type[eid] = towerType;
        Tower.damage[eid] = damage;
        Tower.projectileSpeed[eid] = projectileSpeed;
        
        // Set range
        Range.value[eid] = range;
        
        Target.eid[eid] = NO_TARGET; // No target initially
        
        // Set firing properties
        Firing.fireInterval[eid] = fireInterval;
        Firing.lastShotTime[eid] = 0; // Can fire immediately
        
        // Set visual properties
        Renderable.type[eid] = 1; // Tower type for rendering
        Renderable.color[eid] = towerType === 0 ? 0x00ff00 : towerType === 1 ? 0xff8800 : 0x0088ff; // Green/Orange/Blue
        Renderable.size[eid] = 30; // Tower size

        console.log(`Created tower ${eid} at (${x}, ${y}) with type ${towerType}, damage ${damage}, fireInterval ${fireInterval}ms, projectileSpeed ${projectileSpeed}, range ${range}`);
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
     * Create sandbox HUD panel on the right side
     * Panel width: 400px, full height
     */
    private createSandboxPanel(): void {
        const panelWidth = 400;
        const panelHeight = this.scale.height;
        const panelX = this.scale.width - panelWidth;
        const panelY = 0;

        // Create main container for the panel
        const panelContainer = this.add.container(panelX, panelY);
        this.sandboxPanel = panelContainer;

        // Create panel background
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2c2c2c, 0.95); // Dark gray with slight transparency
        panelBg.fillRect(0, 0, panelWidth, panelHeight);

        // Add border
        panelBg.lineStyle(2, 0xffffff);
        panelBg.strokeRect(0, 0, panelWidth, panelHeight);

        // Add title
        const titleText = this.add.text(panelWidth / 2, 30, 'SANDBOX', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);

        // Add separator line under title
        const separatorLine = this.add.graphics();
        separatorLine.lineStyle(1, 0x666666);
        separatorLine.lineBetween(20, 60, panelWidth - 20, 60);

        // Add "Towers" label above grid
        const towersLabel = this.add.text(panelWidth / 2, 85, 'Towers', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        towersLabel.setOrigin(0.5);

        // Create grid: 4 columns x 2 rows (8 squares total)
        const gridGraphics = this.add.graphics();
        const padding = 10; // Padding from panel edges
        const gridStartY = 110; // Start after title, separator, label, and spacing
        const availableWidth = panelWidth - (padding * 2); // Available width minus left/right padding
        const cellSize = availableWidth / 4; // Square size (smaller to fit with padding)
        
        // Draw 8 squares (4 columns x 2 rows) - fixed size squares, not stretched
        gridGraphics.lineStyle(2, 0x666666); // Grid border color
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const x = padding + col * cellSize; // Start with left padding
                const y = gridStartY + row * cellSize;
                // Draw square border (fixed size, not stretched, with padding)
                gridGraphics.strokeRect(x, y, cellSize, cellSize);
            }
        }

        // Create draggable tower icon in first square (col=0, row=0)
        const towerIcon = this.createTowerIcon(padding, gridStartY, cellSize);
        if (towerIcon) {
            panelContainer.add(towerIcon);
        }

        // Calculate position for input fields (below squares)
        const gridEndY = gridStartY + (2 * cellSize); // End of grid squares
        const inputStartY = gridEndY + 20; // Start input fields with spacing
        const labelHeight = 20; // Height for label text
        const inputHeight = 25; // Input height
        const gapBetweenLabelAndInput = 5; // Gap between label and input
        const gapBetweenPairs = 20; // Gap between label+input pairs
        const pairHeight = labelHeight + gapBetweenLabelAndInput + inputHeight; // Total height of one label+input pair
        const inputWidth = panelWidth - (padding * 2); // Input width

        // Create input fields for tower stats using DOMElement
        const towerStatsInputs: { label: Phaser.GameObjects.Text; input: Phaser.GameObjects.DOMElement }[] = [];
        const statsLabels = ['Damage', 'Fire Interval (ms)', 'Projectile Speed', 'Range'];
        const defaultValues = ['10', '1000', '1500', '100'];

        statsLabels.forEach((label, index) => {
            // Calculate positions: labels are in container coordinates, inputs are in scene coordinates
            const labelY = inputStartY + (index * (pairHeight + gapBetweenPairs));
            const inputY = labelY + labelHeight + gapBetweenLabelAndInput;
            
            // Create label (in container coordinates, will be transformed by container position)
            const labelText = this.add.text(padding, labelY, label + ':', {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });

            // Create DOM input element using Phaser DOMElement (in scene coordinates)
            const inputStyle = `width: ${inputWidth}px; height: ${inputHeight}px; background-color: #1a1a1a; color: #ffffff; border: 1px solid #666666; border-radius: 3px; padding: 5px; font-size: 14px; font-family: Arial, sans-serif;`;
            const inputHTML = `<input type="number" value="${defaultValues[index]}" style="${inputStyle}" />`;
            
            // Position input relative to panel (panelX + padding for x, panelY + inputY for y)
            const inputDOMElement = this.add.dom(panelX + padding, panelY + inputY).createFromHTML(inputHTML);
            inputDOMElement.setOrigin(0, 0);
            inputDOMElement.setDepth(1001); // Above panel

            towerStatsInputs.push({ label: labelText, input: inputDOMElement });
        });

        // Store inputs for later access
        this.sandboxPanel.setData('towerStatsInputs', towerStatsInputs);

        // Add all elements to container
        panelContainer.add([panelBg, titleText, separatorLine, towersLabel, gridGraphics, ...towerStatsInputs.map(item => item.label)]);

        // Set depth to ensure panel is on top
        panelContainer.setDepth(1000);
        
        // Sort container children by depth so elements with higher depth render on top
        panelContainer.sort('depth');

        console.log(`Created sandbox panel at (${panelX}, ${panelY}) with size ${panelWidth}x${panelHeight}`);
    }

    /**
     * Get tower stats from input fields
     * @returns Object with tower stats values
     */
    private getTowerStatsFromInputs(): { damage: number; fireInterval: number; projectileSpeed: number; range: number } | null {
        const towerStatsInputs = this.sandboxPanel.getData('towerStatsInputs') as { 
            label: Phaser.GameObjects.Text; 
            input: Phaser.GameObjects.DOMElement 
        }[] | undefined;

        if (!towerStatsInputs) {
            console.warn('Tower stats inputs not found');
            return null;
        }

        const defaults = [10, 1000, 1500, 100];
        const statNames = ['damage', 'fireInterval', 'projectileSpeed', 'range'];
        const rawValues: string[] = [];
        const parsedValues: number[] = [];

        // Process all inputs
        towerStatsInputs.forEach((item, index) => {
            const node = item.input.node;
            const inputElement = node?.tagName === 'INPUT' 
                ? node as HTMLInputElement 
                : node?.querySelector('input[type="number"]') as HTMLInputElement;
            
            const rawValue = inputElement?.value || '';
            const parsedValue = parseFloat(rawValue) || defaults[index];
            
            rawValues.push(rawValue);
            parsedValues.push(parsedValue);
        });

        // Log raw values
        console.log(`Reading tower stats from inputs (raw): ${statNames.map((name, i) => `${name}="${rawValues[i]}"`).join(', ')}`);

        return {
            damage: parsedValues[0],
            fireInterval: parsedValues[1],
            projectileSpeed: parsedValues[2],
            range: parsedValues[3]
        };
    }

    /**
     * Create draggable tower icon in the first square
     * @returns Container with tower icon, positioned relative to panel container
     */
    private createTowerIcon(squareX: number, squareY: number, cellSize: number): Phaser.GameObjects.Container | null {
        // Create container for tower icon (relative to panel container coordinates)
        const iconContainer = this.add.container(squareX + cellSize / 2, squareY + cellSize / 2);
        
        // Create tower visual (small rectangle representing tower)
        const towerGraphics = this.add.graphics();
        const iconSize = cellSize * 0.6; // 60% of cell size
        towerGraphics.fillStyle(0x00ff00); // Green color for tower
        towerGraphics.fillRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize);
        towerGraphics.lineStyle(2, 0xffffff);
        towerGraphics.strokeRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize);

        iconContainer.add(towerGraphics);
        
        // Make container interactive and draggable
        iconContainer.setInteractive(new Phaser.Geom.Rectangle(-iconSize / 2, -iconSize / 2, iconSize, iconSize), Phaser.Geom.Rectangle.Contains);
        iconContainer.setDepth(2000); // High depth to be above panel elements

        // Store original position (relative to panel container)
        const originalX = squareX + cellSize / 2;
        const originalY = squareY + cellSize / 2;
        
        // Get panel position for coordinate conversion
        const panelWidth = 400;
        const panelX = this.scale.width - panelWidth;
        const panelY = 0;

        // Drag and drop handlers
        iconContainer.on('pointerdown', () => {
            this.isDraggingTower = true;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingTower && this.towerIcon) {
                // Convert pointer position to panel container coordinates
                const localX = pointer.x - panelX;
                const localY = pointer.y - panelY;
                this.towerIcon.setPosition(localX, localY);
            }
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingTower) {
                this.isDraggingTower = false;
                
                // Check if dropped outside the panel (on the game scene)
                const panelWidth = 400;
                const isOutsidePanel = pointer.x < (this.scale.width - panelWidth);
                
                if (isOutsidePanel) {
                    // Get tower stats from inputs
                    const stats = this.getTowerStatsFromInputs();
                    
                    if (stats) {
                        // Create tower at drop position
                        this.createTower(pointer.x, pointer.y, {
                            towerType: 0,
                            damage: stats.damage,
                            fireInterval: stats.fireInterval,
                            projectileSpeed: stats.projectileSpeed,
                            range: stats.range
                        });
                    }
                }
                
                // Return icon to original position
                if (this.towerIcon) {
                    this.towerIcon.setPosition(originalX, originalY);
                }
            }
        });

        this.towerIcon = iconContainer;
        return iconContainer;
    }

    /**
     * Convert hex color string to number
     */
    private hexToNumber(hex: string): number {
        return parseInt(hex.replace('#', ''), 16);
    }
}

