import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MenuScene } from './game/scenes/MenuScene';

function App()
{
    // Track current scene for UI updates
    const [currentSceneKey, setCurrentSceneKey] = useState('MenuScene');

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const startSandbox = () => {

        if(phaserRef.current)
        {     
            const scene = phaserRef.current.scene;
            
            if (scene && scene.scene.key === 'MenuScene')
            {
                (scene as MenuScene).startSandbox();
            }
            else if (scene && scene.scene.key === 'SandboxScene')
            {
                // Already in sandbox, maybe restart it
                scene.scene.restart();
            }
        }
    }

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        setCurrentSceneKey(scene.scene.key);
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            <div>
                <div>
                    <button className="button" onClick={startSandbox}>
                        {currentSceneKey === 'MenuScene' ? 'Start Sandbox' : 'Restart Sandbox'}
                    </button>
                </div>
                <div className="spritePosition">
                    Current Scene: {currentSceneKey}
                </div>
            </div>
        </div>
    )
}

export default App
