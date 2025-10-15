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

    }

    create()
    {
        console.log('MenuScene created');

        // Add some text
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'Tower Defense Game', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'Click "Start Sandbox" to begin', {
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
