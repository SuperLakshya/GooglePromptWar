/**
 * @module GameOverScreen
 * @description Victory/Defeat screen with game stats, score calculation, 
 * and leaderboard submission. Displays after win/loss conditions are met.
 */
import React, { useEffect, useState } from 'react';
import useGameStore from '../../store/gameStore';
import { getCurrentEra } from '../../engine/EraSystem';
import { addToLocalLeaderboard, getLocalLeaderboard, trackEvent, GameEvents } from '../../services/googleServices';

/**
 * Calculates the final score based on game state.
 * @param {Object} state - Game state snapshot
 * @returns {number} Calculated score
 */
function calculateScore(state) {
    const playerCiv = state.civilizations[0];
    if (!playerCiv) return 0;

    const eraScore = playerCiv.eraIndex * 500;
    const resourceScore = Math.floor(
        (playerCiv.resources.food + playerCiv.resources.wood + playerCiv.resources.stone + playerCiv.resources.gold) * 0.1
    );
    const unitScore = playerCiv.units.length * 20;
    const buildingScore = state.buildings.filter(b => b.civId === 'player' && b.progress >= 1).length * 50;
    const moraleBonus = Math.floor(playerCiv.morale * 2);
    const tickPenalty = Math.floor(state.tick * 0.1);

    return Math.max(0, eraScore + resourceScore + unitScore + buildingScore + moraleBonus - tickPenalty);
}

export default function GameOverScreen() {
    const gameOverState = useGameStore(s => s.gameOverState);
    const civilizations = useGameStore(s => s.civilizations);
    const buildings = useGameStore(s => s.buildings);
    const tick = useGameStore(s => s.tick);
    const difficulty = useGameStore(s => s.difficulty);
    const setScreen = useGameStore(s => s.setScreen);
    const [playerName, setPlayerName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    const isVictory = gameOverState === 'victory';
    const playerCiv = civilizations[0];
    const era = playerCiv ? getCurrentEra(playerCiv.eraIndex) : { name: 'Stone Age' };

    const score = calculateScore({ civilizations, buildings, tick });

    useEffect(() => {
        setLeaderboard(getLocalLeaderboard());
        trackEvent(GameEvents.GAME_OVER, { victory: isVictory, score, era: era.name, difficulty });
    }, []);

    const handleSubmitScore = () => {
        if (!playerName.trim()) return;
        const entry = {
            playerName: playerName.trim().slice(0, 20),
            score,
            era: era.name,
            difficulty,
            victory: isVictory,
        };
        const updated = addToLocalLeaderboard(entry);
        setLeaderboard(updated);
        setSubmitted(true);
    };

    const formatTime = (t) => {
        const seconds = Math.floor(t / 4);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="game-over-screen" role="dialog" aria-label={isVictory ? 'Victory screen' : 'Defeat screen'}>
            <div className="game-over-content">
                <div className={`game-over-icon ${isVictory ? 'victory' : 'defeat'}`}>
                    {isVictory ? '👑' : '💀'}
                </div>
                <h1 className={`game-over-title ${isVictory ? 'victory' : 'defeat'}`}>
                    {isVictory ? 'VICTORY' : 'DEFEAT'}
                </h1>
                <p className="game-over-subtitle">
                    {isVictory
                        ? 'All enemy civilizations have fallen. Your sovereignty is absolute.'
                        : 'Your Town Center has been destroyed. Your civilization crumbles to dust.'}
                </p>

                {/* Stats */}
                <div className="game-over-stats" role="table" aria-label="Game statistics">
                    <div className="stat-row">
                        <span className="stat-label">Score</span>
                        <span className="stat-value gold">{score.toLocaleString()}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Era Reached</span>
                        <span className="stat-value">{era.name}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Time Survived</span>
                        <span className="stat-value">{formatTime(tick)}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Difficulty</span>
                        <span className="stat-value">{difficulty}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Units Remaining</span>
                        <span className="stat-value">{playerCiv?.units.length || 0}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Buildings Built</span>
                        <span className="stat-value">{buildings.filter(b => b.civId === 'player').length}</span>
                    </div>
                </div>

                {/* Leaderboard submission */}
                {!submitted ? (
                    <div className="leaderboard-submit" role="form" aria-label="Submit your score">
                        <input
                            type="text"
                            className="leaderboard-input"
                            placeholder="Enter your name..."
                            value={playerName}
                            onChange={e => setPlayerName(e.target.value)}
                            maxLength={20}
                            aria-label="Player name for leaderboard"
                            onKeyDown={e => e.key === 'Enter' && handleSubmitScore()}
                        />
                        <button
                            className="leaderboard-submit-btn"
                            onClick={handleSubmitScore}
                            disabled={!playerName.trim()}
                            aria-label="Submit score to leaderboard"
                        >
                            Submit Score
                        </button>
                    </div>
                ) : (
                    <p className="submit-success" role="status">✅ Score submitted!</p>
                )}

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                    <div className="leaderboard-table" role="table" aria-label="Leaderboard">
                        <h3 className="leaderboard-title">🏆 Leaderboard</h3>
                        {leaderboard.slice(0, 5).map((entry, i) => (
                            <div key={i} className="leaderboard-row" role="row">
                                <span className="lb-rank" role="cell">#{i + 1}</span>
                                <span className="lb-name" role="cell">{entry.playerName}</span>
                                <span className="lb-score" role="cell">{entry.score.toLocaleString()}</span>
                                <span className="lb-era" role="cell">{entry.era}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="game-over-actions">
                    <button
                        className="menu-btn primary"
                        onClick={() => setScreen('menu')}
                        aria-label="Return to main menu"
                    >
                        Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
}
