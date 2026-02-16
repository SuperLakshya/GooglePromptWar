/**
 * @module BottomBar
 * @description Bottom action bar with panel toggles, era advancement, tile info,
 * demolish/disband buttons, and save game. Shows contextual actions based on
 * the currently selected tile.
 */
import React, { memo, useCallback } from 'react';
import useGameStore from '../../store/gameStore';
import { getTile } from '../../engine/MapGenerator';
import { BUILDINGS } from '../../engine/constants';

function BottomBar() {
    const setActivePanel = useGameStore(s => s.setActivePanel);
    const activePanel = useGameStore(s => s.activePanel);
    const selectedTile = useGameStore(s => s.selectedTile);
    const tiles = useGameStore(s => s.tiles);
    const buildings = useGameStore(s => s.buildings);
    const civilizations = useGameStore(s => s.civilizations);
    const advanceEra = useGameStore(s => s.advanceEra);
    const demolishBuilding = useGameStore(s => s.demolishBuilding);
    const disbandUnit = useGameStore(s => s.disbandUnit);
    const saveGame = useGameStore(s => s.saveGame);

    const playerCiv = civilizations[0];

    // Get selected tile info
    let tileInfo = null;
    let tileBuilding = null;
    let tileUnits = [];
    if (selectedTile) {
        tileInfo = getTile(tiles, selectedTile.q, selectedTile.r);
        tileBuilding = buildings.find(b => b.position.q === selectedTile.q && b.position.r === selectedTile.r && b.civId === 'player');
        tileUnits = playerCiv?.units.filter(u => u.position.q === selectedTile.q && u.position.r === selectedTile.r) || [];
    }

    const handleDemolish = useCallback(() => {
        if (tileBuilding) demolishBuilding(tileBuilding.id);
    }, [tileBuilding, demolishBuilding]);

    const handleDisband = useCallback(() => {
        if (tileUnits.length > 0) disbandUnit(tileUnits[0].id);
    }, [tileUnits, disbandUnit]);

    return (
        <div className="bottom-bar" role="toolbar" aria-label="Game actions">
            <button
                className={`action-btn ${activePanel === 'build' ? 'active' : ''}`}
                onClick={() => setActivePanel('build')}
                aria-label="Open build menu (B)"
                aria-pressed={activePanel === 'build'}
            >
                <span className="btn-icon" aria-hidden="true">🏗️</span> Build
            </button>

            <button
                className={`action-btn ${activePanel === 'diplomacy' ? 'active' : ''}`}
                onClick={() => setActivePanel('diplomacy')}
                aria-label="Open diplomacy panel (D)"
                aria-pressed={activePanel === 'diplomacy'}
            >
                <span className="btn-icon" aria-hidden="true">🤝</span> Diplomacy
            </button>

            <button
                className={`action-btn ${activePanel === 'advisor' ? 'active' : ''}`}
                onClick={() => setActivePanel('advisor')}
                aria-label="Open advisor panel (A)"
                aria-pressed={activePanel === 'advisor'}
            >
                <span className="btn-icon" aria-hidden="true">📋</span> Advisor
            </button>

            {playerCiv?.canAdvanceEra && (
                <button
                    className="action-btn advance-era"
                    onClick={advanceEra}
                    aria-label="Advance to next era"
                >
                    <span className="btn-icon" aria-hidden="true">🏛️</span> Advance Era!
                </button>
            )}

            {/* Demolish / Disband buttons */}
            {tileBuilding && tileBuilding.type !== 'townCenter' && (
                <button
                    className="action-btn demolish-btn"
                    onClick={handleDemolish}
                    aria-label={`Demolish ${BUILDINGS[tileBuilding.type]?.name}`}
                    title="Demolish (50% refund)"
                >
                    <span className="btn-icon" aria-hidden="true">🔨</span> Demolish
                </button>
            )}

            {tileUnits.length > 0 && (
                <button
                    className="action-btn disband-btn"
                    onClick={handleDisband}
                    aria-label={`Disband ${tileUnits[0].name}`}
                    title="Disband (30% refund)"
                >
                    <span className="btn-icon" aria-hidden="true">👋</span> Disband
                </button>
            )}

            {/* Save game */}
            <button
                className="action-btn save-btn"
                onClick={saveGame}
                aria-label="Save game"
                title="Save game (Ctrl+S)"
            >
                <span className="btn-icon" aria-hidden="true">💾</span> Save
            </button>

            {/* Tile info */}
            <div className="tile-info" role="status" aria-label="Selected tile information">
                {tileInfo && (
                    <>
                        <span className="tile-info-terrain">
                            {tileInfo.terrain.name} ({selectedTile.q},{selectedTile.r})
                        </span>
                        {tileInfo.terrain.food > 0 && <span aria-label={`Food yield: ${tileInfo.terrain.food}`}>🌾{tileInfo.terrain.food}</span>}
                        {tileInfo.terrain.wood > 0 && <span aria-label={`Wood yield: ${tileInfo.terrain.wood}`}>🪵{tileInfo.terrain.wood}</span>}
                        {tileInfo.terrain.stone > 0 && <span aria-label={`Stone yield: ${tileInfo.terrain.stone}`}>🪨{tileInfo.terrain.stone}</span>}
                        {tileInfo.terrain.gold > 0 && <span aria-label={`Gold yield: ${tileInfo.terrain.gold}`}>🪙{tileInfo.terrain.gold}</span>}
                        {tileBuilding && (
                            <span className="tile-info-building">
                                {BUILDINGS[tileBuilding.type]?.icon} {BUILDINGS[tileBuilding.type]?.name}
                                {tileBuilding.progress < 1 && ` (${Math.floor(tileBuilding.progress * 100)}%)`}
                                <span className="building-hp"> HP: {tileBuilding.hp}</span>
                            </span>
                        )}
                        {tileUnits.length > 0 && (
                            <span className="tile-info-units">
                                {tileUnits.length} unit{tileUnits.length > 1 ? 's' : ''}: {tileUnits.map(u => u.icon).join('')}
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default memo(BottomBar);
