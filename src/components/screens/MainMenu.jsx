/**
 * @module MainMenu
 * @description Main menu screen with difficulty selection. Displays the game title,
 * animated particles, difficulty cards, and navigation buttons.
 */
import React, { useState, useCallback } from 'react';
import useGameStore from '../../store/gameStore';
import { getAllDifficulties } from '../../engine/DifficultyConfig';

export default function MainMenu() {
    const startNewGame = useGameStore(s => s.startNewGame);
    const setDifficulty = useGameStore(s => s.setDifficulty);
    const difficulty = useGameStore(s => s.difficulty);
    const loadGame = useGameStore(s => s.loadGame);
    const [showHowToPlay, setShowHowToPlay] = useState(false);

    const difficulties = getAllDifficulties();

    const handleStartGame = useCallback(() => {
        startNewGame();
    }, [startNewGame]);

    const handleLoadGame = useCallback(() => {
        const success = loadGame();
        if (!success) {
            alert('No saved game found.');
        }
    }, [loadGame]);

    return (
        <div className="main-menu" role="main" aria-label="Sovereign main menu">
            {/* Floating particles */}
            <div className="menu-particles" aria-hidden="true">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 6}s`,
                            animationDuration: `${4 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            <div className="menu-content">
                <div className="menu-crown" aria-hidden="true">👑</div>
                <h1 className="menu-title">SOVEREIGN</h1>
                <p className="menu-subtitle">AI-Native Strategy</p>

                {/* Difficulty Selector */}
                <div className="difficulty-selector" role="radiogroup" aria-label="Select difficulty">
                    {difficulties.map(d => (
                        <button
                            key={d.id}
                            className={`difficulty-card ${difficulty === d.id ? 'selected' : ''}`}
                            style={{ '--diff-color': d.color }}
                            onClick={() => setDifficulty(d.id)}
                            role="radio"
                            aria-checked={difficulty === d.id}
                            aria-label={`${d.name} difficulty: ${d.description}`}
                        >
                            <span className="diff-icon" aria-hidden="true">{d.icon}</span>
                            <span className="diff-name">{d.name}</span>
                            <span className="diff-desc">{d.description}</span>
                        </button>
                    ))}
                </div>

                <div className="menu-buttons">
                    <button
                        className="menu-btn primary"
                        onClick={handleStartGame}
                        aria-label="Start a new game"
                    >
                        ⚔️ New Game
                    </button>
                    <button
                        className="menu-btn"
                        onClick={handleLoadGame}
                        aria-label="Continue saved game"
                    >
                        💾 Continue
                    </button>
                    <button
                        className="menu-btn"
                        onClick={() => setShowHowToPlay(!showHowToPlay)}
                        aria-expanded={showHowToPlay}
                        aria-controls="how-to-play"
                    >
                        📜 How to Play
                    </button>
                </div>

                {showHowToPlay && (
                    <div id="how-to-play" className="how-to-play" role="region" aria-label="Game instructions">
                        <h3>How to Play</h3>
                        <ul>
                            <li><strong>B</strong> — Open Build Menu</li>
                            <li><strong>D</strong> — Open Diplomacy Panel</li>
                            <li><strong>A</strong> — Open Advisor Panel</li>
                            <li><strong>Space</strong> — Pause / Resume</li>
                            <li><strong>Escape</strong> — Cancel build mode / Close panels</li>
                            <li><strong>Click tiles</strong> — Select and interact</li>
                            <li><strong>Drag map</strong> — Pan the view</li>
                            <li><strong>Scroll</strong> — Zoom in/out</li>
                        </ul>
                        <p>Destroy all enemy Town Centers to win!</p>
                    </div>
                )}
            </div>

            <div className="menu-version" aria-label="Game version">v0.2 — AI Warfare Update</div>
        </div>
    );
}
