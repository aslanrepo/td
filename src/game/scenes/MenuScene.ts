import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MenuScene extends Scene
{
    constructor()
    {
        super({ key: 'MenuScene' });
    }

    init()
    {
        // We can't access the scene's width and height from here, so we need to get it from the game
        const width = this.scale.width;
        const height = this.scale.height;
    }

    create()
    {
        console.log('MenuScene created');

        // Add some text
        this.add.text(512, 384, 'Tower Defense Game', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(512, 450, 'Click "Start Sandbox" to begin', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Emit the current scene ready event
        EventBus.emit('current-scene-ready', this);
    }

    startSandbox()
    {
        this.scene.start('SandboxScene');
    }
}
