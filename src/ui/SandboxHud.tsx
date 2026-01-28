import { useEffect, useMemo, useRef, useState } from 'react';

import { enemiesData } from '../game/config/enemies';
import Button from '../components/Button/Button';
import styles from './SandboxHud.module.css';

type TowerStats = {
    damage: number;
    fireInterval: number;
    projectileSpeed: number;
    range: number;
};

type EnemyStats = {
    hp: number;
    speed: number;
};

export type SandboxHudProps = {
    /**
     * Active Phaser scene instance, provided by the `current-scene-ready` EventBus event.
     * We intentionally keep this type broad and do runtime-guarded method calls,
     * so the HUD stays decoupled from Phaser scene implementations.
     */
    activeScene: Phaser.Scene | null;
    /**
     * Custom MIME type used for drag-and-drop payload from the HUD to the game surface.
     */
    towerDropMimeType: string;
};

export function SandboxHud({ activeScene, towerDropMimeType }: SandboxHudProps) {
    const enemyIds = useMemo(() => enemiesData.enemies.map(e => e.id), []);

    const [towerStats, setTowerStats] = useState<TowerStats>({
        damage: 10,
        fireInterval: 1000,
        projectileSpeed: 1500,
        range: 150,
    });

    const [enemyStats, setEnemyStats] = useState<EnemyStats>({
        hp: 100,
        speed: 100,
    });

    const [presetEnemyId, setPresetEnemyId] = useState<string>(() => enemyIds[0] ?? 'red');
    const [scale, setScale] = useState<number>(1);
    const [wrapperHeight, setWrapperHeight] = useState<string>('100%');
    const rootRef = useRef<HTMLDivElement>(null);

    const isSandbox = activeScene?.scene?.key === 'SandboxScene';

    const callScene = (methodName: string, ...args: any[]) => {
        if (!activeScene || !isSandbox) {
            return;
        }

        const fn = (activeScene as any)[methodName];
        if (typeof fn !== 'function') {
            return;
        }

        fn.apply(activeScene, args);
    };

    // Calculate and apply scaling to fit content within viewport
    useEffect(() => {
        if (!rootRef.current || !isSandbox) {
            return;
        }

        const updateScale = () => {
            const root = rootRef.current;
            if (!root) {
                return;
            }

            // Get the actual parent container (.hudPane), not the wrapper
            const wrapper = root.parentElement;
            const parent = wrapper?.parentElement;
            if (!parent || !wrapper) {
                return;
            }

            // Get available height (parent height minus padding)
            const parentStyle = window.getComputedStyle(parent);
            const parentPaddingTop = parseFloat(parentStyle.paddingTop) || 0;
            const parentPaddingBottom = parseFloat(parentStyle.paddingBottom) || 0;
            const availableHeight = parent.clientHeight - parentPaddingTop - parentPaddingBottom;

            // Get content height
            const contentHeight = root.scrollHeight;

            // Calculate scale if content is taller than available space
            if (contentHeight > availableHeight && availableHeight > 0) {
                const calculatedScale = availableHeight / contentHeight;
                // Use a minimum scale of 0.7 to ensure readability
                const finalScale = Math.max(0.7, calculatedScale);
                setScale(finalScale);
                // Adjust wrapper height to match scaled content
                setWrapperHeight(`${contentHeight * finalScale}px`);
            } else {
                setScale(1);
                setWrapperHeight('100%');
            }
        };

        // Initial calculation
        updateScale();

        // Recalculate on window resize
        window.addEventListener('resize', updateScale);
        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(rootRef.current);
        if (rootRef.current.parentElement) {
            resizeObserver.observe(rootRef.current.parentElement);
        }

        return () => {
            window.removeEventListener('resize', updateScale);
            resizeObserver.disconnect();
        };
    }, [isSandbox, towerStats, enemyStats, presetEnemyId]);

    if (!isSandbox) {
        return null;
    }

    return (
        <div
            className={styles.sandboxHudWrapper}
            style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'top left',
                height: wrapperHeight,
            }}
        >
            <div
                ref={rootRef}
                className={styles.sandboxHudRoot}
            >
            <div className={styles.sandboxHudHeader}>
                <div className={styles.sandboxHudTitle}>SANDBOX</div>
            </div>

            <div className={styles.sandboxHudSection}>
                <div className={styles.sandboxHudSectionTitle}>Towers</div>

                <div className={styles.sandboxHudRow}>
                    <div
                        className={styles.sandboxHudTowerIcon}
                        draggable
                        onDragStart={(event) => {
                            // HTML5 drag payload is the simplest way to get a drop on the canvas surface.
                            // We keep the payload small and parse/validate on the scene side as well.
                            event.dataTransfer.setData(towerDropMimeType, JSON.stringify(towerStats));
                            event.dataTransfer.effectAllowed = 'copy';
                        }}
                        title="Drag onto the game field to place a tower"
                        aria-label="Tower draggable"
                    />
                    <div className={styles.sandboxHudHint}>
                        Drag the green square onto the game to place a tower.
                    </div>
                </div>

                <div className={`${styles.sandboxHudForm} ${styles.sandboxHudFormTower}`}>
                    <label className={styles.sandboxHudField}>
                        <span className={styles.sandboxHudLabel}>Damage</span>
                        <input
                            className={styles.sandboxHudInput}
                            type="number"
                            value={towerStats.damage}
                            onChange={(e) => setTowerStats(s => ({ ...s, damage: Number(e.target.value) }))}
                        />
                    </label>

                    <label className={styles.sandboxHudField}>
                        <span className={styles.sandboxHudLabel}>Fire Interval (ms)</span>
                        <input
                            className={styles.sandboxHudInput}
                            type="number"
                            value={towerStats.fireInterval}
                            onChange={(e) => setTowerStats(s => ({ ...s, fireInterval: Number(e.target.value) }))}
                        />
                    </label>

                    <label className={styles.sandboxHudField}>
                        <span className={styles.sandboxHudLabel}>Projectile Speed</span>
                        <input
                            className={styles.sandboxHudInput}
                            type="number"
                            value={towerStats.projectileSpeed}
                            onChange={(e) => setTowerStats(s => ({ ...s, projectileSpeed: Number(e.target.value) }))}
                        />
                    </label>

                    <label className={styles.sandboxHudField}>
                        <span className={styles.sandboxHudLabel}>Range</span>
                        <input
                            className={styles.sandboxHudInput}
                            type="number"
                            value={towerStats.range}
                            onChange={(e) => setTowerStats(s => ({ ...s, range: Number(e.target.value) }))}
                        />
                    </label>
                </div>
            </div>

            <div className={styles.sandboxHudSection}>
                <div className={styles.sandboxHudSectionTitle}>Enemies</div>

                <div className={`${styles.sandboxHudForm} ${styles.sandboxHudFormEnemy}`}>
                    <label className={styles.sandboxHudField}>
                        <span className={styles.sandboxHudLabel}>HP</span>
                        <input
                            className={styles.sandboxHudInput}
                            type="number"
                            value={enemyStats.hp}
                            onChange={(e) => setEnemyStats(s => ({ ...s, hp: Number(e.target.value) }))}
                        />
                    </label>

                    <label className={styles.sandboxHudField}>
                        <span className={styles.sandboxHudLabel}>Speed</span>
                        <input
                            className={styles.sandboxHudInput}
                            type="number"
                            value={enemyStats.speed}
                            onChange={(e) => setEnemyStats(s => ({ ...s, speed: Number(e.target.value) }))}
                        />
                    </label>
                </div>

                <Button className="w-full" onClick={() => callScene('spawnCustomEnemyFromHud', enemyStats)}>
                    Spawn Custom Enemy
                </Button>

                <div className={styles.sandboxHudForm}>
                    <label className={styles.sandboxHudField}>
                        <span className={styles.sandboxHudLabel}>Preset Enemy</span>
                        <select
                            className={styles.sandboxHudSelect}
                            value={presetEnemyId}
                            onChange={(e) => setPresetEnemyId(e.target.value)}
                        >
                            {enemyIds.map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <Button className="w-full" onClick={() => callScene('spawnPresetEnemyFromHud', presetEnemyId)}>
                    Spawn Enemy
                </Button>
            </div>

            <div className={styles.sandboxHudFooter}>
                <Button className="w-full" onClick={() => callScene('backToMenu')}>
                    Back to Menu
                </Button>
            </div>
        </div>
        </div>
    );
}

