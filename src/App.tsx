import { useRef } from 'react';

import { MenuScene } from './game/scenes/MenuScene';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const startSandbox = () => {

        if(phaserRef.current)
        {     
            const scene = phaserRef.current.scene as MenuScene;
            
            if (scene)
            {
                scene.startSandbox();
            }
        }
    }

    // Event emitted from the PhaserGame component
    const currentScene = () => {
        console.log('current scene was invoked');
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
