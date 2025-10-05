import Phaser from 'phaser';
import { TelegramService } from '@/services/TelegramService';
import { TelegramThemeParams } from '@/types';

/**
 * Sandbox Scene - Development and testing environment
 * Implements ECS-like architecture with Phaser components
 * Uses vector graphics and dynamic Telegram theming
 */
export class SandboxScene extends Phaser.Scene {
    private telegramService?: TelegramService;
    private themeParams: TelegramThemeParams;

    constructor() {
        super({ key: 'SandboxScene' });
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

    override update(time: number, delta: number): void {

    }

    /**
     * Create sandbox scene elements
     */
    public create(): void {
        // Фон: простая зеленая лужайка (прямоугольник)
        const bg = this.add.graphics();
        bg.fillStyle(0x228B22); // Зеленый
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        this.createBackButton(this.scale.width, this.scale.height);
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
        buttonBg.fillStyle(this.hexToNumber(this.themeParams.button_color || '#3390EC'));
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
            this.telegramService?.hapticFeedback('impact');
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
            buttonBg.lineStyle(2, this.hexToNumber(this.themeParams.button_color || '#3390EC'));
            buttonBg.strokeRoundedRect(
                -buttonWidth / 2, 
                -buttonHeight / 2, 
                buttonWidth, 
                buttonHeight, 
                10
            );
            buttonText.setColor(this.themeParams.button_color || '#3390EC');
        });
        
        buttonContainer.on('pointerout', () => {
            console.log('Button hover ended');
            buttonBg.clear();
            buttonBg.fillStyle(this.hexToNumber(this.themeParams.button_color || '#3390EC'));
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
     * Convert hex color string to number
     */
    private hexToNumber(hex: string): number {
        return parseInt(hex.replace('#', ''), 16);
    }
}
