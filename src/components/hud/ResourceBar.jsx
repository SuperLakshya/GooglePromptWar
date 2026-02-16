import React from 'react';
import useGameStore from '../../store/gameStore';
import { getCurrentEra } from '../../engine/EraSystem';

export default function ResourceBar() {
    const civilizations = useGameStore(s => s.civilizations);
    const paused = useGameStore(s => s.paused);
    const togglePause = useGameStore(s => s.togglePause);
    const tick = useGameStore(s => s.tick);
    const research = useGameStore(s => s.research);

    const playerCiv = civilizations[0];
    if (!playerCiv) return null;

    const { resources, morale, eraIndex } = playerCiv;
    const era = getCurrentEra(eraIndex);
    const popCount = playerCiv.units.length;

    const moraleClass = morale >= 70 ? 'high' : morale >= 40 ? 'medium' : 'low';
    const moraleEmoji = morale >= 70 ? '😊' : morale >= 40 ? '😐' : '😠';

    const formatTime = (t) => {
        const seconds = Math.floor(t / 4);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="resource-bar">
            <div className="resource-item">
                <span className="resource-icon">🌾</span>
                <span className="resource-value">{Math.floor(resources.food)}</span>
            </div>
            <div className="resource-item">
                <span className="resource-icon">🪵</span>
                <span className="resource-value">{Math.floor(resources.wood)}</span>
            </div>
            <div className="resource-item">
                <span className="resource-icon">🪨</span>
                <span className="resource-value">{Math.floor(resources.stone)}</span>
            </div>
            <div className="resource-item">
                <span className="resource-icon">🪙</span>
                <span className="resource-value">{Math.floor(resources.gold)}</span>
            </div>
            <div className="resource-item">
                <span className="resource-icon">📜</span>
                <span className="resource-value">{Math.floor(research)}</span>
            </div>
            <div className="resource-item">
                <span className="resource-icon">👥</span>
                <span className="resource-value">{popCount}</span>
            </div>

            <div className={`morale-indicator ${moraleClass}`}>
                {moraleEmoji} {morale}%
            </div>

            <div className="era-badge" style={{ borderColor: era.color }}>
                {era.name}
            </div>

            <div className="game-controls">
                <button className={`control-btn ${paused ? 'active' : ''}`} onClick={togglePause}>
                    {paused ? '▶' : '⏸'}
                </button>
                <span style={{ fontSize: 12, color: '#9aa0b0', alignSelf: 'center' }}>
                    {formatTime(tick)}
                </span>
            </div>
        </div>
    );
}
