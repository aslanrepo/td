import { useCallback, useMemo, useRef, useState } from 'react';

import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import Button from './components/Button/Button';
import { SandboxHud } from './ui/SandboxHud';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const [activeSceneKey, setActiveSceneKey] = useState<string | null>(null);
    const [activeScene, setActiveScene] = useState<Phaser.Scene | null>(null);

    const isSandboxActive = activeSceneKey === 'SandboxScene';
    const isMenuActive = activeSceneKey === 'MenuScene';

    const towerDropMimeType = useMemo(() => 'application/x-td-tower', []);

    // Event emitted from the PhaserGame component
    const currentScene = useCallback((scene_instance: Phaser.Scene) => {
        setActiveSceneKey(scene_instance.scene.key);
        setActiveScene(scene_instance);
    }, []);

    const onGameDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        if (!isSandboxActive) {
            return;
        }

        // Allow drop only when the drag payload is our tower.
        if (event.dataTransfer.types.includes(towerDropMimeType)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        }
    }, [isSandboxActive, towerDropMimeType]);

    const onGameDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        if (!isSandboxActive) {
            return;
        }

        const payload = event.dataTransfer.getData(towerDropMimeType);
        if (!payload) {
            return;
        }

        event.preventDefault();

        const game = phaserRef.current?.game;
        const scene = activeScene;
        const canvas = game?.canvas;

        if (!game || !scene || !canvas) {
            return;
        }

        if (!('placeTowerFromHud' in scene) || typeof (scene as any).placeTowerFromHud !== 'function') {
            return;
        }

        let stats: { damage: number; fireInterval: number; projectileSpeed: number; range: number } | null = null;
        try {
            stats = JSON.parse(payload);
        } catch {
            stats = null;
        }

        if (!stats) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const gameWidth = Number(game.config.width);
        const gameHeight = Number(game.config.height);

        if (!Number.isFinite(gameWidth) || !Number.isFinite(gameHeight)) {
            return;
        }

        const rawX = ((event.clientX - rect.left) * gameWidth) / rect.width;
        const rawY = ((event.clientY - rect.top) * gameHeight) / rect.height;

        const x = Math.max(0, Math.min(gameWidth, rawX));
        const y = Math.max(0, Math.min(gameHeight, rawY));

        (scene as any).placeTowerFromHud(x, y, stats);
    }, [activeScene, isSandboxActive, towerDropMimeType]);

    const startSandbox = useCallback(() => {
        const game = phaserRef.current?.game;
        if (!game) {
            return;
        }

        const current = activeScene;
        const maybeStartSandbox = (current as any)?.startSandbox;
        if (typeof maybeStartSandbox === 'function') {
            maybeStartSandbox.call(current);
            return;
        }

        game.scene.start('SandboxScene');
    }, [activeScene]);

    return (
        <div id="app">
            <div className="gamePane" onDragOver={onGameDragOver} onDrop={onGameDrop}>
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            </div>

            <aside className="hudPane" aria-label="Right panel">
                {isMenuActive && (
                    <div className="menuRightPanel">
                        <div className="menuRightPanelTitle">MENU</div>
                        <Button className="w-full" onClick={startSandbox}>
                            Start Sandbox
                        </Button>
                    </div>
                )}

                {isSandboxActive && (
                    <SandboxHud activeScene={activeScene} towerDropMimeType={towerDropMimeType} />
                )}
            </aside>
        </div>
    )
}

export default App
