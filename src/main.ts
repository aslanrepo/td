import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { SandboxScene } from './scenes/SandboxScene';
import { TelegramService } from './services/TelegramService';

/**
 * Main game configuration following ECS-like architecture
 * Optimized for Telegram WebApp with landscape orientation
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL, // WebGL for optimal performance
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
    backgroundColor: '#1a1a1a',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, SandboxScene],
    render: {
        antialias: true,
        pixelArt: false
    }
};

/**
 * Initialize Telegram WebApp integration
 * Lock orientation to landscape for mobile compatibility
 */
async function initializeApp(): Promise<void> {
    try {
        // Lock orientation to landscape
        if (screen.orientation && 'lock' in screen.orientation) {
            await (screen.orientation as any).lock('landscape-primary');
        }
        
        // Initialize Telegram service
        const telegramService = new TelegramService();
        await telegramService.initialize();
        
        // Start the game
        const game = new Phaser.Game(config);
        
        // Handle window resize for responsive design
        window.addEventListener('resize', () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        });
        
        // Store services in game registry for global access
        game.registry.set('telegramService', telegramService);
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback: start game without Telegram integration
        const game = new Phaser.Game(config);
        
        // Handle window resize for responsive design
        window.addEventListener('resize', () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        });
    }
}

// Start the application
initializeApp();
