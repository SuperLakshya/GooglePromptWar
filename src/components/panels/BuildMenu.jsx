import React from 'react';
import useGameStore from '../../store/gameStore';
import { getAvailableBuildings, getAvailableUnits } from '../../engine/EraSystem';
import { canAfford } from '../../engine/ResourceManager';
import { BUILDINGS, UNITS } from '../../engine/constants';

export default function BuildMenu() {
    const civilizations = useGameStore(s => s.civilizations);
    const enterBuildMode = useGameStore(s => s.enterBuildMode);
    const setActivePanel = useGameStore(s => s.setActivePanel);
    const trainUnit = useGameStore(s => s.trainUnit);
    const buildings = useGameStore(s => s.buildings);

    const playerCiv = civilizations[0];
    if (!playerCiv) return null;

    const availableBuildings = getAvailableBuildings(playerCiv.eraIndex);
    const availableUnits = getAvailableUnits(playerCiv.eraIndex);

    const formatCost = (cost) => {
        return Object.entries(cost)
            .filter(([, v]) => v > 0)
            .map(([res, amt]) => {
                const icons = { food: '🌾', wood: '🪵', stone: '🪨', gold: '🪙' };
                return `${icons[res] || ''} ${amt}`;
            })
            .join(' ');
    };

    return (
        <>
            <div className="panel-header">
                <span className="panel-title">Build & Train</span>
                <button className="panel-close" onClick={() => setActivePanel(null)}>✕</button>
            </div>
            <div className="panel-body">
                <h4 style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#d4a84b', marginBottom: 12, letterSpacing: 1 }}>
                    Buildings
                </h4>
                <div className="build-grid">
                    {availableBuildings.map(bType => {
                        const def = BUILDINGS[bType];
                        if (!def) return null;
                        const affordable = canAfford(playerCiv.resources, def.cost);
                        const alreadyBuilt = bType === 'townCenter' && buildings.some(b => b.civId === 'player' && b.type === 'townCenter');

                        return (
                            <div
                                key={bType}
                                className={`build-item ${!affordable || alreadyBuilt ? 'disabled' : ''}`}
                                onClick={() => affordable && !alreadyBuilt && enterBuildMode(bType)}
                                title={def.name}
                            >
                                <span className="build-icon">{def.icon}</span>
                                <span className="build-name">{def.name}</span>
                                <span className="build-cost">{formatCost(def.cost) || 'Free'}</span>
                            </div>
                        );
                    })}
                </div>

                <h4 style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#d4a84b', margin: '20px 0 12px', letterSpacing: 1 }}>
                    Units
                </h4>
                <div className="build-grid">
                    {availableUnits.map(uType => {
                        const def = UNITS[uType];
                        if (!def) return null;
                        const affordable = canAfford(playerCiv.resources, def.cost);

                        return (
                            <div
                                key={uType}
                                className={`build-item ${!affordable ? 'disabled' : ''}`}
                                onClick={() => affordable && trainUnit(uType)}
                                title={`${def.name} — ATK:${def.atk} DEF:${def.def} HP:${def.hp}`}
                            >
                                <span className="build-icon">{def.icon}</span>
                                <span className="build-name">{def.name}</span>
                                <span className="build-cost">{formatCost(def.cost)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
