import Phaser from 'phaser';
import { TelegramService } from '@/services/TelegramService';
import { TelegramThemeParams } from '@/types';

/**
 * Menu Scene - Start screen with "Start Game" button
 * Implements ECS-like architecture with Phaser components
 * Uses vector graphics and dynamic Telegram theming
 */
export class MenuScene extends Phaser.Scene {
    private telegramService?: TelegramService;
    private themeParams: TelegramThemeParams;

    constructor() {
        super({ key: 'MenuScene' });
        this.themeParams = {
            bg_color: '#1a1a1a',
            button_color: '#3390EC',
            text_color: '#ffffff'
        };
    }

    /**
     * Initialize scene with Telegram service
     */
    public init(): void {
        this.telegramService = this.game.registry.get('telegramService');
        this.themeParams = this.telegramService?.getThemeParams() || {
            bg_color: '#1a1a1a',
            button_color: '#3390EC',
            text_color: '#ffffff'
        };
    }

    /**
     * Create menu scene elements
     */
    public create(): void {
        const { width, height } = this.cameras.main;
        
        // Set background color from Telegram theme
        this.cameras.main.setBackgroundColor(this.themeParams.bg_color || '#1a1a1a');
        
        // Create title
        this.createTitle(width, height);
        
        // Create start button
        this.createStartButton(width, height);
        
        // Listen for theme changes
        this.setupThemeListener();
        
        // Listen for window resize
        this.setupResizeListener();
        
        // Add some visual effects
        this.createBackgroundEffects();
    }

    /**
     * Create game title with dynamic theming
     */
    private createTitle(width: number, height: number): void {
        const titleText = this.add.text(width / 2, height / 3, 'TOWER DEFENSE', {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            color: this.themeParams.text_color ?? '#ffffff',
            fontStyle: 'bold'
        });
        
        titleText.setOrigin(0.5);
        titleText.setStroke('#000000', 2);
        
        // Add subtitle
        const subtitleText = this.add.text(width / 2, height / 3 + 60, 'Defend Your Base!', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: this.themeParams.text_color ?? '#ffffff',
            fontStyle: 'italic'
        });
        
        subtitleText.setOrigin(0.5);
        
        // Add title animation
        this.tweens.add({
            targets: titleText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Create start game button with vector graphics
     */
    private createStartButton(width: number, height: number): void {
        console.log('width and height', width, height);
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = width / 2;
        const buttonY = height / 2 + 50;
        
        // Create button background
        const buttonBg = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x000000);
        buttonBg.setStrokeStyle(2, parseInt((this.themeParams.button_color || '#3390EC').replace('#', ''), 16));
        
        // Create button text
        const buttonText = this.add.text(buttonX, buttonY, 'SANDBOX', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: this.themeParams.button_color ?? '#3390EC',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        // Make button interactive
        buttonBg.setInteractive();
        buttonBg.on('pointerdown', () => {
            this.telegramService?.hapticFeedback('impact');
            this.scene.start('SandboxScene');
        });
        
        // Add hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(parseInt((this.themeParams.button_color || '#3390EC').replace('#', ''), 16), 0.2);
            buttonText.setColor('#ffffff');
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x000000);
            buttonText.setColor(this.themeParams.button_color || '#3390EC');
        });
        
        // Add button animation
        this.tweens.add({
            targets: buttonBg,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Setup theme change listener
     */
    private setupThemeListener(): void {
        window.addEventListener('telegramThemeChanged', (event: Event) => {
            const customEvent = event as CustomEvent;
            this.themeParams = customEvent.detail;
            this.updateTheme();
        });
    }

    /**
     * Setup window resize listener
     */
    private setupResizeListener(): void {
        window.addEventListener('resize', () => {
            const { width, height } = this.cameras.main;
            this.updateLayout(width, height);
        });
    }

    /**
     * Create background visual effects
     */
    private createBackgroundEffects(): void {
        const { width, height } = this.cameras.main;
        
        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(2, 5),
                parseInt((this.themeParams.button_color || '#3390EC').replace('#', ''), 16),
                0.3
            );
            
            // Animate particles
            this.tweens.add({
                targets: particle,
                y: particle.y - 100,
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000),
                onComplete: () => {
                    particle.setPosition(Phaser.Math.Between(0, width), height + 50);
                    particle.setAlpha(0.3);
                }
            });
        }
    }

    /**
     * Update theme colors
     */
    private updateTheme(): void {
        this.cameras.main.setBackgroundColor(this.themeParams.bg_color || '#1a1a1a');
        
        // Update all text colors
        this.children.list.forEach((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Text) {
                child.setColor(this.themeParams.text_color || '#ffffff');
            }
        });
    }

    /**
     * Update layout on resize
     */
    private updateLayout(width: number, height: number): void {
        // Update title position
        const titleText = this.children.getByName('title') as Phaser.GameObjects.Text | undefined;
        if (titleText) {
            titleText.setPosition(width / 2, height / 3);
        }
        
        // Update button position
        const buttonBg = this.children.getByName('startButton') as Phaser.GameObjects.Rectangle | undefined;
        if (buttonBg) {
            buttonBg.setPosition(width / 2, height / 2 + 50);
        }
    }
}
