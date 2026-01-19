import { addComponent, defineQuery } from 'bitecs';
import { Scene } from 'phaser';

import { GameWorld } from '../ecs';
import { Position, Renderable, Velocity, PathProgress, PathIndex, Enemy, Tower, Range, Target, Firing, NO_TARGET, Health } from '../ecs';
import { EventBus } from '../EventBus';
import { entityVisualConfig, TowerType } from '../config/entityConfig';
import { enemiesData, getEnemyById } from '../config/enemies';
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
    private sandboxPanel!: Phaser.GameObjects.Container;
    private towerIcon: Phaser.GameObjects.Container | null = null;
    private isDraggingTower = false;

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

        // Create sandbox HUD panel
        this.createSandboxPanel();

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
     * Create back button to return to menu
     * @param buttonX - X position relative to panel container
     * @param buttonY - Y position relative to panel container
     * @returns Container with back button
     */
    private createBackButton(buttonX: number, buttonY: number): Phaser.GameObjects.Container {
        const buttonWidth = 150;
        const buttonHeight = 50;

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
        const buttonText = this.add.text(0, 0, 'BACK TO MENU', {
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

        // Add click handler
        buttonContainer.on('pointerdown', () => {
            this.scene.start('MenuScene');
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

        return buttonContainer;
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
        // Don't track if clicking on UI elements
        if (this.isClickOnUI(pointer)) {
            return;
        }

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

        // Don't process if clicking on UI elements
        if (this.isClickOnUI(pointer)) {
            this.pointerDownPosition = null;
            return;
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
     * Check if click is on UI elements (panel, buttons, etc.)
     * Uses panel position and size directly to check if pointer is within panel container
     * This automatically covers all UI elements since they are children of the panel container
     */
    private isClickOnUI(pointer: Phaser.Input.Pointer): boolean {
        // Check if panel exists
        if (!this.sandboxPanel) {
            return false;
        }

        // Get panel position and size directly from container
        // Container position is in world coordinates, so we can use it directly
        const panelX = this.sandboxPanel.x;
        const panelY = this.sandboxPanel.y;
        const panelWidth = 400; // Panel width is fixed (defined in createSandboxPanel)
        const panelHeight = this.scale.height; // Panel height matches scene height

        // Check if pointer is within panel bounds
        // Since all UI elements (buttons, inputs, etc.) are children of the panel container,
        // checking panel bounds covers all UI interactions
        return pointer.x >= panelX &&
            pointer.x <= panelX + panelWidth &&
            pointer.y >= panelY &&
            pointer.y <= panelY + panelHeight;
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
        const gapBetweenPairs = 25; // Gap between label+input pairs
        const pairHeight = labelHeight + gapBetweenLabelAndInput + inputHeight; // Total height of one label+input pair
        const inputWidth = panelWidth - (padding * 2); // Input width

        // Create input fields for tower stats using DOMElement
        const towerStatsInputs: { label: Phaser.GameObjects.Text; input: Phaser.GameObjects.DOMElement }[] = [];
        const statsLabels = ['Damage', 'Fire Interval (ms)', 'Projectile Speed', 'Range'];
        const defaultValues = ['10', '1000', '1500', '150'];

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

        // Calculate position for enemy section (below tower inputs)
        const lastTowerInputIndex = statsLabels.length - 1;
        const lastTowerInputY = inputStartY + (lastTowerInputIndex * (pairHeight + gapBetweenPairs)) + labelHeight + gapBetweenLabelAndInput + inputHeight;
        const enemySectionStartY = lastTowerInputY + 30; // Spacing after tower inputs

        // Add separator line before enemy section
        const enemySeparatorLine = this.add.graphics();
        enemySeparatorLine.lineStyle(1, 0x666666);
        enemySeparatorLine.lineBetween(20, enemySectionStartY, panelWidth - 20, enemySectionStartY);

        // Add "Enemies" label
        const enemiesLabel = this.add.text(panelWidth / 2, enemySectionStartY + 20, 'Enemies', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        enemiesLabel.setOrigin(0.5);

        // Create input fields for enemy stats
        const enemyStatsInputs: { label: Phaser.GameObjects.Text; input: Phaser.GameObjects.DOMElement }[] = [];
        const enemyStatsLabels = ['HP', 'Speed'];
        const enemyDefaultValues = ['100', '100'];
        const enemyInputStartY = enemySectionStartY + 50; // Start after label

        enemyStatsLabels.forEach((label, index) => {
            const labelY = enemyInputStartY + (index * (pairHeight + gapBetweenPairs));
            const inputY = labelY + labelHeight + gapBetweenLabelAndInput;

            // Create label
            const labelText = this.add.text(padding, labelY, label + ':', {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });

            // Create DOM input element
            const inputStyle = `width: ${inputWidth}px; height: ${inputHeight}px; background-color: #1a1a1a; color: #ffffff; border: 1px solid #666666; border-radius: 3px; padding: 5px; font-size: 14px; font-family: Arial, sans-serif;`;
            const inputHTML = `<input type="number" value="${enemyDefaultValues[index]}" style="${inputStyle}" />`;

            const inputDOMElement = this.add.dom(panelX + padding, panelY + inputY).createFromHTML(inputHTML);
            inputDOMElement.setOrigin(0, 0);
            inputDOMElement.setDepth(1001);

            enemyStatsInputs.push({ label: labelText, input: inputDOMElement });
        });

        // Store enemy inputs for later access
        this.sandboxPanel.setData('enemyStatsInputs', enemyStatsInputs);

        // Create spawn custom enemy button
        const buttonY = enemyInputStartY + (enemyStatsLabels.length * (pairHeight + gapBetweenPairs)) + 20;
        const customSpawnButton = this.createCustomEnemySpawnButton(panelWidth / 2, buttonY);

        // Create enemy dropdown below custom spawn button
        const dropdownY = buttonY + 50; // 50px spacing after button
        const dropdownWidth = panelWidth - (padding * 2);
        const enemyDropdown = this.createEnemyDropdown(padding, dropdownY, panelX, panelY, dropdownWidth);
        this.sandboxPanel.setData('enemyDropdown', enemyDropdown);

        // Create spawn preset enemy button below dropdown
        const presetButtonY = dropdownY + 60; // 40px spacing after dropdown
        const presetSpawnButton = this.createPresetEnemySpawnButton(panelWidth / 2, presetButtonY);

        // Create back button at the bottom of the panel
        const backButtonY = panelHeight - 60; // 60px from bottom (50px button height + 10px padding)
        const backButton = this.createBackButton(panelWidth / 2, backButtonY);

        // Add all elements to container
        panelContainer.add([
            panelBg,
            titleText,
            separatorLine,
            towersLabel,
            gridGraphics,
            ...towerStatsInputs.map(item => item.label),
            enemySeparatorLine,
            enemiesLabel,
            ...enemyStatsInputs.map(item => item.label),
            customSpawnButton,
            presetSpawnButton,
            backButton
        ]);

        // Set depth to ensure panel is on top
        panelContainer.setDepth(1000);

        // Sort container children by depth so elements with higher depth render on top
        panelContainer.sort('depth');

        console.log(`Created sandbox panel at (${panelX}, ${panelY}) with size ${panelWidth}x${panelHeight}`);
    }

    /**
     * Get enemy stats from input fields
     * @returns Object with enemy stats values
     */
    private getEnemyStatsFromInputs(): { hp: number; speed: number } | null {
        const enemyStatsInputs = this.sandboxPanel.getData('enemyStatsInputs') as {
            label: Phaser.GameObjects.Text;
            input: Phaser.GameObjects.DOMElement
        }[] | undefined;

        if (!enemyStatsInputs) {
            console.warn('Enemy stats inputs not found');
            return null;
        }

        const defaults = [100, 100];
        const statNames = ['hp', 'speed'];
        const rawValues: string[] = [];
        const parsedValues: number[] = [];

        // Process all inputs
        enemyStatsInputs.forEach((item, index) => {
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
        console.log(`Reading enemy stats from inputs (raw): ${statNames.map((name, i) => `${name}="${rawValues[i]}"`).join(', ')}`);

        return {
            hp: parsedValues[0],
            speed: parsedValues[1]
        };
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
     * Create spawn custom enemy button
     * @param buttonX - X position relative to panel container
     * @param buttonY - Y position relative to panel container
     * @returns Container with spawn button
     */
    private createCustomEnemySpawnButton(buttonX: number, buttonY: number): Phaser.GameObjects.Container {
        const buttonWidth = 200;
        const buttonHeight = 40;

        // Create button container (position relative to panel container)
        const buttonContainer = this.add.container(buttonX, buttonY);

        // Create button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(this.hexToNumber('#3390EC'));
        buttonBg.fillRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            8
        );

        // Add button border
        buttonBg.lineStyle(2, 0xffffff);
        buttonBg.strokeRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            8
        );

        // Create button text
        const buttonText = this.add.text(0, 0, 'Spawn Custom Enemy', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // Add both to container
        buttonContainer.add([buttonBg, buttonText]);

        // Make container interactive
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        );

        // Add click handler
        buttonContainer.on('pointerdown', () => {
            const stats = this.getEnemyStatsFromInputs();
            if (stats) {
                // Get visual properties from config for 'red' enemy type
                const visualConfig = getEnemyVisualById('red');
                if (visualConfig) {
                    this.spawnEnemy({
                        hp: stats.hp,
                        speed: stats.speed,
                        renderType: visualConfig.renderType,
                        color: visualConfig.color,
                        size: visualConfig.size
                    });
                }
            }
        });

        // Add hover effects
        buttonContainer.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0xffffff);
            buttonBg.fillRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                8
            );
            buttonBg.lineStyle(2, this.hexToNumber('#3390EC'));
            buttonBg.strokeRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                8
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
                8
            );
            buttonBg.lineStyle(2, 0xffffff);
            buttonBg.strokeRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                8
            );
            buttonText.setColor('#ffffff');
        });

        return buttonContainer;
    }

    /**
     * Create enemy dropdown selector
     * @param dropdownX - X position relative to panel container
     * @param dropdownY - Y position relative to panel container
     * @param panelX - Panel X position in scene coordinates
     * @param panelY - Panel Y position in scene coordinates
     * @param dropdownWidth - Width of the dropdown
     * @returns DOMElement with select dropdown
     */
    private createEnemyDropdown(dropdownX: number, dropdownY: number, panelX: number, panelY: number, dropdownWidth: number): Phaser.GameObjects.DOMElement {
        // Get all enemy IDs from config
        const enemyIds = enemiesData.enemies.map(enemy => enemy.id);

        // Create options HTML
        const optionsHTML = enemyIds.map(id => `<option value="${id}">${id}</option>`).join('');

        // Create select element HTML
        const selectStyle = `width: ${dropdownWidth}px; height: 30px; background-color: #1a1a1a; color: #ffffff; border: 1px solid #666666; border-radius: 3px; padding: 5px; font-size: 14px; font-family: Arial, sans-serif;`;
        const selectHTML = `<select style="${selectStyle}">${optionsHTML}</select>`;

        // Create DOM element (position in scene coordinates)
        const dropdownDOM = this.add.dom(panelX + dropdownX, panelY + dropdownY).createFromHTML(selectHTML);
        dropdownDOM.setOrigin(0, 0);
        dropdownDOM.setDepth(1001); // Above panel

        return dropdownDOM;
    }

    /**
     * Create spawn preset enemy button
     * @param buttonX - X position relative to panel container
     * @param buttonY - Y position relative to panel container
     * @returns Container with spawn button
     */
    private createPresetEnemySpawnButton(buttonX: number, buttonY: number): Phaser.GameObjects.Container {
        const buttonWidth = 200;
        const buttonHeight = 40;

        // Create button container (position relative to panel container)
        const buttonContainer = this.add.container(buttonX, buttonY);

        // Create button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(this.hexToNumber('#3390EC'));
        buttonBg.fillRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            8
        );

        // Add button border
        buttonBg.lineStyle(2, 0xffffff);
        buttonBg.strokeRoundedRect(
            -buttonWidth / 2,
            -buttonHeight / 2,
            buttonWidth,
            buttonHeight,
            8
        );

        // Create button text
        const buttonText = this.add.text(0, 0, 'Spawn Enemy', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // Add both to container
        buttonContainer.add([buttonBg, buttonText]);

        // Make container interactive
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        );

        // Add click handler
        buttonContainer.on('pointerdown', () => {
            const enemyDropdown = this.sandboxPanel.getData('enemyDropdown') as Phaser.GameObjects.DOMElement | undefined;
            if (!enemyDropdown) {
                console.warn('Enemy dropdown not found');
                return;
            }

            const node = enemyDropdown.node;
            const selectElement = node?.tagName === 'SELECT'
                ? node as HTMLSelectElement
                : node?.querySelector('select') as HTMLSelectElement;

            const selectedEnemyId = selectElement?.value;
            if (selectedEnemyId) {
                // Get enemy configuration from config files
                const enemyConfig = getEnemyById(selectedEnemyId);
                const visualConfig = getEnemyVisualById(selectedEnemyId);
                
                if (!enemyConfig) {
                    console.error(`Enemy config not found for ID: ${selectedEnemyId}`);
                    return;
                }
                
                if (!visualConfig) {
                    console.error(`Enemy visual config not found for ID: ${selectedEnemyId}`);
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
            } else {
                console.warn('No enemy selected');
            }
        });

        // Add hover effects
        buttonContainer.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0xffffff);
            buttonBg.fillRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                8
            );
            buttonBg.lineStyle(2, this.hexToNumber('#3390EC'));
            buttonBg.strokeRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                8
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
                8
            );
            buttonBg.lineStyle(2, 0xffffff);
            buttonBg.strokeRoundedRect(
                -buttonWidth / 2,
                -buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                8
            );
            buttonText.setColor('#ffffff');
        });

        return buttonContainer;
    }

    /**
     * Spawn enemy with preset configuration from config files
     * @param enemyId - Enemy ID from enemies.json (e.g., 'red', 'blue', 'moab')
     */

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
                        this.createTower(pointer.x, pointer.y, 'basic', {
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

    /**
     * Stop auto-spawn timer
     */
    private stopAutoSpawn(): void {
        if (this.autoSpawnTimer) {
            this.autoSpawnTimer.destroy();
            this.autoSpawnTimer = null;
            console.log('Auto-spawn stopped');
        }
    }

    /**
     * Convert hex color string to number
     */
    private hexToNumber(hex: string): number {
        return parseInt(hex.replace('#', ''), 16);
    }
}

