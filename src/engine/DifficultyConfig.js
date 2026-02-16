/**
 * @module DifficultyConfig
 * @description Centralized difficulty settings for AI behavior, resource rates,
 * and attack frequency. Each difficulty level adjusts multipliers that affect
 * the overall game challenge.
 */

/**
 * @typedef {Object} DifficultySettings
 * @property {string} id - Difficulty identifier
 * @property {string} name - Display name
 * @property {string} description - Description for difficulty selection UI
 * @property {string} icon - Emoji icon for the difficulty
 * @property {string} color - CSS color for the difficulty card
 * @property {number} aiResourceMultiplier - Multiplier for AI resource gathering (1.0 = same as player)
 * @property {number} aiAggressionTimer - Ticks between AI attack waves (lower = more aggressive)
 * @property {number} aiStartingUnits - Number of starting units for AI civs
 * @property {number} aiMaxMilitary - Max military units AI will maintain
 * @property {number} aiAttackGroupSize - Units per attack wave
 * @property {number} playerResourceBonus - Bonus multiplier for player resources
 * @property {boolean} aiExploits - Whether AI uses advanced counter-strategies
 */

/** @type {Object<string, DifficultySettings>} */
export const DIFFICULTY_SETTINGS = Object.freeze({
    easy: Object.freeze({
        id: 'easy',
        name: 'Easy',
        description: 'Relaxed pace. AI opponents are passive and rarely attack. Perfect for learning the game mechanics.',
        icon: '🌱',
        color: '#4caf7a',
        aiResourceMultiplier: 0.7,
        aiAggressionTimer: 400,    // ~100 seconds between attacks
        aiStartingUnits: 3,
        aiMaxMilitary: 4,
        aiAttackGroupSize: 2,
        playerResourceBonus: 1.3,
        aiExploits: false,
    }),
    medium: Object.freeze({
        id: 'medium',
        name: 'Medium',
        description: 'Balanced challenge. AI sends periodic raids and adapts to your strategy. A fair fight for experienced players.',
        icon: '⚔️',
        color: '#d98c4a',
        aiResourceMultiplier: 1.0,
        aiAggressionTimer: 200,    // ~50 seconds between attacks
        aiStartingUnits: 4,
        aiMaxMilitary: 8,
        aiAttackGroupSize: 4,
        playerResourceBonus: 1.0,
        aiExploits: true,
    }),
    hard: Object.freeze({
        id: 'hard',
        name: 'Hard',
        description: 'Relentless aggression. AI exploits weaknesses, attacks frequently, and outproduces you. Only for the bold.',
        icon: '💀',
        color: '#d94a4a',
        aiResourceMultiplier: 1.5,
        aiAggressionTimer: 100,    // ~25 seconds between attacks
        aiStartingUnits: 6,
        aiMaxMilitary: 14,
        aiAttackGroupSize: 6,
        playerResourceBonus: 0.9,
        aiExploits: true,
    }),
});

/**
 * Gets difficulty settings by ID.
 *
 * @param {string} difficultyId - One of 'easy', 'medium', 'hard'
 * @returns {DifficultySettings} The settings for the requested difficulty
 */
export function getDifficultySettings(difficultyId) {
    return DIFFICULTY_SETTINGS[difficultyId] || DIFFICULTY_SETTINGS.medium;
}

/**
 * Returns all available difficulty options for UI display.
 *
 * @returns {DifficultySettings[]} Array of all difficulty settings
 */
export function getAllDifficulties() {
    return Object.values(DIFFICULTY_SETTINGS);
}
