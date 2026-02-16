/**
 * @module googleServices
 * @description Google Services integration for Sovereign game.
 * Provides Firebase Analytics for event tracking and Firestore
 * for game save/load and leaderboard functionality.
 *
 * Uses Google Fonts (Cinzel + Inter) loaded via CSS @import.
 *
 * SETUP: Replace the firebaseConfig values below with your own
 * Firebase project credentials from https://console.firebase.google.com
 */

// ═══════════════════════════════════════════════════════════════
// Firebase Configuration
// Replace with your own project values
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: 'AIzaSyDEMO_REPLACE_WITH_YOUR_KEY',
    authDomain: 'sovereign-game.firebaseapp.com',
    projectId: 'sovereign-game',
    storageBucket: 'sovereign-game.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
    databaseURL: 'https://sovereign-game-default-rtdb.firebaseio.com',
};

let firebaseApp = null;
let analytics = null;
let database = null;
let isInitialized = false;

/**
 * Dynamically imports and initializes Firebase services.
 * Uses dynamic import to avoid blocking initial page load.
 *
 * @returns {Promise<boolean>} Whether initialization succeeded
 */
export async function initializeFirebase() {
    if (isInitialized) return true;

    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
        const { getAnalytics, logEvent: firebaseLogEvent } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js');
        const { getDatabase, ref, set, get, push, query, orderByChild, limitToLast } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js');

        firebaseApp = initializeApp(firebaseConfig);
        analytics = { instance: getAnalytics(firebaseApp), logEvent: firebaseLogEvent };
        database = { instance: getDatabase(firebaseApp), ref, set, get, push, query, orderByChild, limitToLast };
        isInitialized = true;

        console.log('[Sovereign] Firebase initialized successfully');
        return true;
    } catch (error) {
        console.warn('[Sovereign] Firebase initialization failed (offline mode):', error.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// Analytics — Event Tracking
// ═══════════════════════════════════════════════════════════════

/**
 * Tracks a game event in Firebase Analytics.
 * Fails silently if Firebase is not initialized.
 *
 * @param {string} eventName - Event name (e.g., 'game_start', 'era_advance')
 * @param {Object} [params={}] - Event parameters
 */
export function trackEvent(eventName, params = {}) {
    if (!analytics) return;

    try {
        analytics.logEvent(analytics.instance, eventName, {
            ...params,
            timestamp: Date.now(),
        });
    } catch {
        // Silently fail — analytics should never break the game
    }
}

/**
 * Predefined game events for consistent tracking.
 */
export const GameEvents = Object.freeze({
    GAME_START: 'game_start',
    GAME_OVER: 'game_over',
    ERA_ADVANCE: 'era_advance',
    BUILDING_PLACED: 'building_placed',
    BUILDING_DEMOLISHED: 'building_demolished',
    UNIT_TRAINED: 'unit_trained',
    COMBAT_RESULT: 'combat_result',
    DIPLOMACY_SENT: 'diplomacy_message',
    TRADE_COMPLETED: 'trade_completed',
    ALLIANCE_FORMED: 'alliance_formed',
    WAR_DECLARED: 'war_declared',
    DIFFICULTY_SELECTED: 'difficulty_selected',
});

// ═══════════════════════════════════════════════════════════════
// Realtime Database — Save / Load / Leaderboard
// ═══════════════════════════════════════════════════════════════

/**
 * Saves game state to Firebase Realtime Database.
 *
 * @param {string} playerId - Unique player identifier
 * @param {Object} gameState - Serializable game state to save
 * @returns {Promise<boolean>} Whether save succeeded
 */
export async function saveGameToCloud(playerId, gameState) {
    if (!database) return false;

    try {
        const saveRef = database.ref(database.instance, `saves/${playerId}`);
        await database.set(saveRef, {
            state: gameState,
            savedAt: Date.now(),
            version: '0.2.0',
        });
        return true;
    } catch (error) {
        console.warn('[Sovereign] Cloud save failed:', error.message);
        return false;
    }
}

/**
 * Loads game state from Firebase Realtime Database.
 *
 * @param {string} playerId - Unique player identifier
 * @returns {Promise<Object|null>} Saved game state or null if not found
 */
export async function loadGameFromCloud(playerId) {
    if (!database) return null;

    try {
        const saveRef = database.ref(database.instance, `saves/${playerId}`);
        const snapshot = await database.get(saveRef);
        if (snapshot.exists()) {
            return snapshot.val().state;
        }
        return null;
    } catch (error) {
        console.warn('[Sovereign] Cloud load failed:', error.message);
        return null;
    }
}

/**
 * Submits a score to the global leaderboard.
 *
 * @param {Object} entry - Leaderboard entry
 * @param {string} entry.playerName - Display name
 * @param {number} entry.score - Final score
 * @param {string} entry.era - Era reached
 * @param {string} entry.difficulty - Difficulty played
 * @param {boolean} entry.victory - Whether the game was won
 * @returns {Promise<boolean>} Whether submission succeeded
 */
export async function submitToLeaderboard(entry) {
    if (!database) return false;

    try {
        const leaderboardRef = database.ref(database.instance, 'leaderboard');
        await database.push(leaderboardRef, {
            ...entry,
            timestamp: Date.now(),
        });
        trackEvent(GameEvents.GAME_OVER, { score: entry.score, victory: entry.victory });
        return true;
    } catch (error) {
        console.warn('[Sovereign] Leaderboard submission failed:', error.message);
        return false;
    }
}

/**
 * Fetches the top scores from the global leaderboard.
 *
 * @param {number} [limit=10] - Maximum number of entries to fetch
 * @returns {Promise<Array>} Array of leaderboard entries sorted by score
 */
export async function fetchLeaderboard(limit = 10) {
    if (!database) return [];

    try {
        const leaderboardRef = database.ref(database.instance, 'leaderboard');
        const topQuery = database.query(
            leaderboardRef,
            database.orderByChild('score'),
            database.limitToLast(limit)
        );
        const snapshot = await database.get(topQuery);
        if (!snapshot.exists()) return [];

        const entries = [];
        snapshot.forEach(child => {
            entries.push({ id: child.key, ...child.val() });
        });

        return entries.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.warn('[Sovereign] Leaderboard fetch failed:', error.message);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// Local Fallback — Always available save/load
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'sovereign_save';

/**
 * Saves game state to localStorage as a fallback.
 *
 * @param {Object} gameState - Serializable game state
 * @returns {boolean} Whether save succeeded
 */
export function saveGameLocally(gameState) {
    try {
        const serializable = JSON.parse(JSON.stringify(gameState));
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            state: serializable,
            savedAt: Date.now(),
            version: '0.2.0',
        }));
        return true;
    } catch (error) {
        console.warn('[Sovereign] Local save failed:', error.message);
        return false;
    }
}

/**
 * Loads game state from localStorage.
 *
 * @returns {Object|null} Saved game state or null if not found
 */
export function loadGameLocally() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.state || null;
    } catch (error) {
        console.warn('[Sovereign] Local load failed:', error.message);
        return null;
    }
}

/**
 * Gets the local leaderboard from localStorage.
 *
 * @returns {Array} Array of leaderboard entries
 */
export function getLocalLeaderboard() {
    try {
        const raw = localStorage.getItem('sovereign_leaderboard');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Adds an entry to the local leaderboard.
 *
 * @param {Object} entry - Score entry
 * @returns {Array} Updated leaderboard
 */
export function addToLocalLeaderboard(entry) {
    try {
        const board = getLocalLeaderboard();
        board.push({ ...entry, timestamp: Date.now() });
        board.sort((a, b) => b.score - a.score);
        const top = board.slice(0, 20);
        localStorage.setItem('sovereign_leaderboard', JSON.stringify(top));
        return top;
    } catch {
        return [];
    }
}
