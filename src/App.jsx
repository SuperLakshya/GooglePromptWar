/**
 * @module App
 * @description Root application component. Routes between MainMenu, GameScreen,
 * and GameOverScreen based on the current screen state.
 */
import React from 'react';
import useGameStore from './store/gameStore';
import MainMenu from './components/screens/MainMenu';
import GameScreen from './components/screens/GameScreen';
import GameOverScreen from './components/screens/GameOverScreen';

/**
 * @returns {React.ReactElement} The active screen component
 */
export default function App() {
  const screen = useGameStore(s => s.screen);

  return (
    <div id="sovereign-app" role="application" aria-label="Sovereign strategy game">
      {/* Skip navigation link for accessibility */}
      <a href="#game-content" className="skip-link">Skip to game content</a>

      <div id="game-content">
        {screen === 'menu' && <MainMenu />}
        {screen === 'game' && <GameScreen />}
        {screen === 'gameover' && <GameOverScreen />}
      </div>
    </div>
  );
}
