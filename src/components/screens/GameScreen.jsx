/**
 * @module GameScreen
 * @description Main game screen layout integrating map, HUD, and side panels.
 * Handles keyboard shortcuts and game loop lifecycle.
 */
import React, { useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import { startGameLoop, stopGameLoop } from '../../engine/GameEngine';
import ResourceBar from '../hud/ResourceBar';
import GameMap from '../map/GameMap';
import BottomBar from '../hud/BottomBar';
import NotificationFeed from '../hud/NotificationFeed';
import MiniMap from '../hud/MiniMap';
import DiplomacyPanel from '../panels/DiplomacyPanel';
import BuildMenu from '../panels/BuildMenu';
import CitizenAdvisor from '../panels/CitizenAdvisor';

export default function GameScreen() {
    const activePanel = useGameStore(s => s.activePanel);
    const buildMode = useGameStore(s => s.buildMode);
    const selectedBuildingType = useGameStore(s => s.selectedBuildingType);
    const togglePause = useGameStore(s => s.togglePause);
    const paused = useGameStore(s => s.paused);

    useEffect(() => {
        const cleanup = startGameLoop(useGameStore);
        return () => {
            cleanup();
            stopGameLoop();
        };
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePause();
                    break;
                case 'Escape':
                    useGameStore.getState().exitBuildMode();
                    useGameStore.getState().setActivePanel(null);
                    break;
                case 'b':
                case 'B':
                    useGameStore.getState().setActivePanel('build');
                    break;
                case 'd':
                case 'D':
                    useGameStore.getState().setActivePanel('diplomacy');
                    break;
                case 'a':
                case 'A':
                    useGameStore.getState().setActivePanel('advisor');
                    break;
                case 's':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        useGameStore.getState().saveGame();
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [togglePause]);

    const renderPanel = () => {
        switch (activePanel) {
            case 'diplomacy': return <DiplomacyPanel />;
            case 'build': return <BuildMenu />;
            case 'advisor': return <CitizenAdvisor />;
            default: return null;
        }
    };

    return (
        <div className="game-screen" role="main" aria-label="Game screen">
            <ResourceBar />

            <div className="game-main">
                <div className="map-container" role="img" aria-label="Game map — use drag to pan and scroll to zoom">
                    <GameMap />

                    {buildMode && (
                        <div className="build-mode-overlay" role="status" aria-live="polite">
                            🏗️ Click a tile to place {selectedBuildingType} — ESC to cancel
                        </div>
                    )}

                    {paused && (
                        <div className="pause-overlay" role="status" aria-live="assertive">
                            ⏸ PAUSED — Press Space to resume
                        </div>
                    )}

                    <MiniMap />
                </div>

                {activePanel && (
                    <div className="side-panel" role="complementary" aria-label={`${activePanel} panel`}>
                        {renderPanel()}
                    </div>
                )}
            </div>

            <NotificationFeed />
            <BottomBar />
        </div>
    );
}
