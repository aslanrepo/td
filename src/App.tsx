import { useRef } from 'react';

import { MenuScene } from './game/scenes/MenuScene';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const startSandbox = () => {
        if(phaserRef.current?.game) {
            const game = phaserRef.current.game;
            const activeScene = game.scene.getScenes(true)[0];
            
            if (activeScene?.scene?.key === 'MenuScene' && 'startSandbox' in activeScene) {
                (activeScene as MenuScene).startSandbox();
            } else {
                game.scene.start('SandboxScene');
            }
        }
    }

    // Event emitted from the PhaserGame component
    const currentScene = () => {
        // Scene ready callback
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            <div>
                <div>
                    <button className="button" onClick={startSandbox}>Start Sandbox</button>
                </div>
            </div>
        </div>
    )
}

export default App
