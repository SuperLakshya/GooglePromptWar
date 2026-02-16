/**
 * @module gameStore
 * @description Central Zustand state management for Sovereign.
 * Manages all game state including civilizations, buildings, diplomacy,
 * difficulty settings, save/load, and game-over conditions.
 */

import { create } from 'zustand';
import { generateMap, findStartPositions, getTile } from '../engine/MapGenerator.js';
import { canAfford, spendResources } from '../engine/ResourceManager.js';
import { getCurrentEra, getNextEra, canAdvanceEra } from '../engine/EraSystem.js';
import { parsePlayerMessage, evaluateDiplomacy, recordDiplomacyEvent, getRelationshipSummary } from '../ai/DiplomacyEngine.js';
import { createWarfareTracker } from '../ai/WarfareAI.js';
import { STARTING_RESOURCES, BUILDINGS, UNITS, MAP_COLS, MAP_ROWS } from '../engine/constants.js';
import { LEADER_PROFILES } from '../ai/LeaderProfiles.js';
import { sanitizeInput, generateSecureId, validateResourceValues, isValidCoordinate } from '../utils/security.js';
import { getDifficultySettings } from '../engine/DifficultyConfig.js';
import { trackEvent, GameEvents, saveGameLocally, loadGameLocally, initializeFirebase } from '../services/googleServices.js';

/**
 * @typedef {Object} GameState
 * @property {string} screen - Current screen: 'menu', 'game', 'gameover'
 * @property {string} difficulty - Difficulty ID: 'easy', 'medium', 'hard'
 * @property {string|null} gameOverState - 'victory', 'defeat', or null
 * @property {number} tick - Current game tick
 */

const useGameStore = create((set, get) => ({
    // ── Screen State ──────────────────────────────────
    screen: 'menu', // 'menu', 'game', 'gameover'

    // ── Difficulty ────────────────────────────────────
    /** @type {'easy'|'medium'|'hard'} */
    difficulty: 'medium',

    // ── Game Over ─────────────────────────────────────
    /** @type {'victory'|'defeat'|null} */
    gameOverState: null,

    // ── Game State ────────────────────────────────────
    tick: 0,
    paused: false,
    gameSpeed: 1,
    research: 0,

    // ── Map ───────────────────────────────────────────
    tiles: [],
    selectedTile: null,
    camera: { x: 0, y: 0, zoom: 1 },

    // ── Civilizations ─────────────────────────────────
    civilizations: [],

    // ── Buildings ─────────────────────────────────────
    buildings: [],

    // ── Diplomacy ─────────────────────────────────────
    diplomacyMemory: {},
    diplomacyChat: {},
    activeDiplomacy: null,

    // ── Advisor ───────────────────────────────────────
    advisorSuggestions: [],

    // ── Notifications ─────────────────────────────────
    notifications: [],

    // ── UI State ──────────────────────────────────────
    activePanel: null,
    buildMode: false,
    selectedBuildingType: null,

    // ═══════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════

    /**
     * Navigates to a screen.
     * @param {string} screen - Target screen name
     */
    setScreen: (screen) => set({ screen }),

    /**
     * Sets the difficulty level before starting a new game.
     * @param {'easy'|'medium'|'hard'} difficulty
     */
    setDifficulty: (difficulty) => {
        trackEvent(GameEvents.DIFFICULTY_SELECTED, { difficulty });
        set({ difficulty });
    },

    // ── New Game ──────────────────────────────────────
    /**
     * Initializes a new game with the selected difficulty.
     * Creates map, player civ, AI civs with appropriate units based on difficulty.
     */
    startNewGame: () => {
        const state = get();
        const diffSettings = getDifficultySettings(state.difficulty);
        const tiles = generateMap(Date.now());
        const positions = findStartPositions(tiles, 3);

        // Player civilization
        const playerPos = positions[0];
        const playerUnits = [];
        for (let i = 0; i < 5; i++) {
            playerUnits.push({
                id: generateSecureId('pv'),
                type: 'worker',
                unitType: 'worker',
                name: 'Villager',
                hp: 25,
                maxHp: 25,
                atk: 3,
                def: 0,
                speed: 1,
                position: { q: playerPos.q + (i % 3) - 1, r: playerPos.r + Math.floor(i / 3) },
                civId: 'player',
                task: 'idle',
                skills: { gathering: 0, building: 0, fighting: 0 },
                icon: '👷',
            });
        }
        playerUnits.push({
            id: generateSecureId('ps'),
            type: 'scout',
            unitType: 'scout',
            name: 'Scout',
            hp: 30,
            maxHp: 30,
            atk: 2,
            def: 0,
            speed: 2,
            position: { q: playerPos.q + 2, r: playerPos.r },
            civId: 'player',
            task: 'idle',
            icon: '🏃',
        });

        // Apply player resource bonus from difficulty
        const playerResources = { ...STARTING_RESOURCES };
        for (const key of Object.keys(playerResources)) {
            playerResources[key] = Math.floor(playerResources[key] * diffSettings.playerResourceBonus);
        }

        const playerCiv = {
            id: 'player',
            name: 'Your Civilization',
            isPlayer: true,
            resources: playerResources,
            eraIndex: 0,
            units: playerUnits,
            morale: 60,
            homePosition: playerPos,
            canAdvanceEra: false,
            atWar: false,
            recentCasualties: 0,
            recentVictories: 0,
        };

        // AI civilizations (scale by difficulty)
        const leaderKeys = Object.keys(LEADER_PROFILES);
        const aiCivs = positions.slice(1).map((pos, i) => {
            const leaderId = leaderKeys[i % leaderKeys.length];
            const leader = LEADER_PROFILES[leaderId];

            const aiUnits = [];
            const unitCount = diffSettings.aiStartingUnits;
            for (let j = 0; j < unitCount; j++) {
                aiUnits.push({
                    id: generateSecureId(`${leaderId.slice(0, 4)}`),
                    type: j < Math.ceil(unitCount / 2) ? 'worker' : 'infantry',
                    unitType: j < Math.ceil(unitCount / 2) ? 'worker' : 'infantry',
                    name: j < Math.ceil(unitCount / 2) ? 'Villager' : 'Militia',
                    hp: j < Math.ceil(unitCount / 2) ? 25 : 40,
                    maxHp: j < Math.ceil(unitCount / 2) ? 25 : 40,
                    atk: j < Math.ceil(unitCount / 2) ? 3 : 6,
                    def: j < Math.ceil(unitCount / 2) ? 0 : 2,
                    speed: 1,
                    position: { q: pos.q + (j % 3) - 1, r: pos.r + Math.floor(j / 3) },
                    civId: leaderId,
                    task: j < Math.ceil(unitCount / 2) ? 'gather' : 'guard',
                    icon: j < Math.ceil(unitCount / 2) ? '👷' : '🗡️',
                });
            }

            return {
                id: leaderId,
                name: leader.name,
                leaderId,
                isPlayer: false,
                resources: { ...STARTING_RESOURCES },
                eraIndex: 0,
                units: aiUnits,
                morale: 60,
                homePosition: pos,
                warfareTracker: createWarfareTracker(),
                currentStrategy: 'balanced',
                lastNotifiedStrategy: null,
                atWar: false,
                recentCasualties: 0,
                recentVictories: 0,
                lastAttackTick: 0,
            };
        });

        // Mark starting tiles as visible
        const updatedTiles = tiles.map(t => {
            const distToPlayer = Math.abs(t.q - playerPos.q) + Math.abs(t.r - playerPos.r);
            return {
                ...t,
                fogState: distToPlayer <= 4 ? 'visible' : 'hidden',
                owner: distToPlayer <= 1 ? 'player' : t.owner,
            };
        });

        // Place Town Centers
        const startBuildings = [{
            id: generateSecureId('ptc'),
            type: 'townCenter',
            position: playerPos,
            civId: 'player',
            progress: 1,
            hp: 500,
        }];

        for (const aiCiv of aiCivs) {
            startBuildings.push({
                id: generateSecureId('atc'),
                type: 'townCenter',
                position: aiCiv.homePosition,
                civId: aiCiv.id,
                progress: 1,
                hp: 500,
            });
        }

        const diplomacyChat = {};
        for (const aiCiv of aiCivs) {
            diplomacyChat[aiCiv.leaderId] = [];
        }

        trackEvent(GameEvents.GAME_START, { difficulty: state.difficulty });
        initializeFirebase();

        set({
            screen: 'game',
            tick: 0,
            paused: false,
            research: 0,
            gameOverState: null,
            tiles: updatedTiles,
            civilizations: [playerCiv, ...aiCivs],
            buildings: startBuildings,
            diplomacyMemory: {},
            diplomacyChat,
            notifications: [{
                id: generateSecureId('notif'),
                type: 'info',
                message: `🏛️ Your civilization has been founded on ${diffSettings.name} difficulty! Build, expand, and conquer.`,
                tick: 0,
                dismissed: false,
            }],
            advisorSuggestions: [],
            selectedTile: null,
            camera: {
                x: playerPos.q * 54 - 400,
                y: playerPos.r * 62 - 300,
                zoom: 1,
            },
        });
    },

    // ── Tile Selection ────────────────────────────────
    /**
     * Selects a tile at the given coordinates if valid.
     * @param {number} q - Column
     * @param {number} r - Row
     */
    selectTile: (q, r) => {
        if (!isValidCoordinate(q, r, MAP_COLS, MAP_ROWS)) return;
        const state = get();
        const tile = getTile(state.tiles, q, r);
        set({ selectedTile: tile ? { q, r } : null });
    },

    // ── Camera ────────────────────────────────────────
    moveCamera: (dx, dy) => set(s => ({
        camera: { ...s.camera, x: s.camera.x + dx, y: s.camera.y + dy },
    })),

    setZoom: (zoom) => set(s => ({
        camera: { ...s.camera, zoom: Math.max(0.3, Math.min(2.5, zoom)) },
    })),

    // ── Building ──────────────────────────────────────
    /**
     * Places a building on the map at (q, r) if affordable and tile is valid.
     * @param {number} q - Column
     * @param {number} r - Row
     * @param {string} buildingType - Building type key from BUILDINGS
     */
    placeBuilding: (q, r, buildingType) => {
        const state = get();
        const def = BUILDINGS[buildingType];
        if (!def) return;
        if (!isValidCoordinate(q, r, MAP_COLS, MAP_ROWS)) return;

        const playerCiv = state.civilizations[0];
        if (!canAfford(playerCiv.resources, def.cost)) return;

        const tile = getTile(state.tiles, q, r);
        if (!tile || tile.terrain.id === 'water' || tile.terrain.id === 'mountain') return;
        if (state.buildings.some(b => b.position.q === q && b.position.r === r)) return;

        const newResources = validateResourceValues(spendResources(playerCiv.resources, def.cost));

        const newBuilding = {
            id: generateSecureId('bld'),
            type: buildingType,
            position: { q, r },
            civId: 'player',
            progress: 0,
            hp: def.hp,
        };

        trackEvent(GameEvents.BUILDING_PLACED, { type: buildingType });

        set({
            buildings: [...state.buildings, newBuilding],
            civilizations: state.civilizations.map((c, i) =>
                i === 0 ? { ...c, resources: newResources } : c
            ),
            buildMode: false,
            selectedBuildingType: null,
            notifications: [...state.notifications, {
                id: generateSecureId('notif'),
                type: 'info',
                message: `🏗️ Construction started: ${def.name}`,
                tick: state.tick,
                dismissed: false,
            }],
        });
    },

    enterBuildMode: (buildingType) => set({ buildMode: true, selectedBuildingType: buildingType }),
    exitBuildMode: () => set({ buildMode: false, selectedBuildingType: null }),

    // ── Building Demolish ──────────────────────────────
    /**
     * Demolishes a player building and refunds 50% of its cost.
     * Cannot demolish the last Town Center.
     * @param {string} buildingId - ID of the building to demolish
     */
    demolishBuilding: (buildingId) => {
        const state = get();
        const building = state.buildings.find(b => b.id === buildingId && b.civId === 'player');
        if (!building) return;

        // Prevent demolishing last Town Center
        const playerTCs = state.buildings.filter(b => b.type === 'townCenter' && b.civId === 'player');
        if (building.type === 'townCenter' && playerTCs.length <= 1) return;

        const def = BUILDINGS[building.type];
        if (!def) return;

        // Refund 50% of building cost
        const playerCiv = state.civilizations[0];
        const refund = {};
        for (const [res, amount] of Object.entries(def.cost)) {
            refund[res] = (playerCiv.resources[res] || 0) + Math.floor(amount * 0.5);
        }
        const updatedResources = { ...playerCiv.resources, ...refund };

        trackEvent(GameEvents.BUILDING_DEMOLISHED, { type: building.type });

        set({
            buildings: state.buildings.filter(b => b.id !== buildingId),
            civilizations: state.civilizations.map((c, i) =>
                i === 0 ? { ...c, resources: validateResourceValues(updatedResources) } : c
            ),
            notifications: [...state.notifications, {
                id: generateSecureId('notif'),
                type: 'info',
                message: `🔨 Demolished ${def.name} — 50% resources refunded`,
                tick: state.tick,
                dismissed: false,
            }],
        });
    },

    // ── Unit Training ─────────────────────────────────
    /**
     * Trains a new unit of the given type for the player.
     * @param {string} unitType - Unit type key from UNITS
     */
    trainUnit: (unitType) => {
        const state = get();
        const def = UNITS[unitType];
        if (!def) return;

        const playerCiv = state.civilizations[0];
        if (!canAfford(playerCiv.resources, def.cost)) return;

        const newResources = validateResourceValues(spendResources(playerCiv.resources, def.cost));
        const newUnit = {
            id: generateSecureId('unit'),
            type: def.type,
            unitType: def.type,
            name: def.name,
            hp: def.hp,
            maxHp: def.hp,
            atk: def.atk,
            def: def.def,
            speed: def.speed,
            range: def.range,
            position: { ...playerCiv.homePosition },
            civId: 'player',
            task: 'idle',
            skills: { gathering: 0, building: 0, fighting: 0 },
            icon: def.icon,
        };

        trackEvent(GameEvents.UNIT_TRAINED, { type: unitType });

        set({
            civilizations: state.civilizations.map((c, i) =>
                i === 0 ? { ...c, resources: newResources, units: [...c.units, newUnit] } : c
            ),
        });
    },

    // ── Unit Disband ───────────────────────────────────
    /**
     * Disbands a player unit, refunding 30% of its cost.
     * @param {string} unitId - ID of the unit to disband
     */
    disbandUnit: (unitId) => {
        const state = get();
        const playerCiv = state.civilizations[0];
        const unit = playerCiv.units.find(u => u.id === unitId);
        if (!unit) return;

        // Find cost from UNITS by matching unit type
        const unitKey = Object.keys(UNITS).find(k => UNITS[k].type === unit.type || UNITS[k].name === unit.name);
        const def = unitKey ? UNITS[unitKey] : null;

        // Refund 30%
        const refund = {};
        if (def?.cost) {
            for (const [res, amount] of Object.entries(def.cost)) {
                refund[res] = (playerCiv.resources[res] || 0) + Math.floor(amount * 0.3);
            }
        }
        const updatedResources = { ...playerCiv.resources, ...refund };

        set({
            civilizations: state.civilizations.map((c, i) =>
                i === 0
                    ? {
                        ...c,
                        resources: validateResourceValues(updatedResources),
                        units: c.units.filter(u => u.id !== unitId),
                    }
                    : c
            ),
            notifications: [...state.notifications, {
                id: generateSecureId('notif'),
                type: 'info',
                message: `👋 Disbanded ${unit.name} — 30% resources refunded`,
                tick: state.tick,
                dismissed: false,
            }],
        });
    },

    // ── Move Unit ─────────────────────────────────────
    moveUnit: (unitId, targetQ, targetR) => {
        const state = get();
        if (!isValidCoordinate(targetQ, targetR, MAP_COLS, MAP_ROWS)) return;
        const tile = getTile(state.tiles, targetQ, targetR);
        if (!tile || tile.terrain.id === 'water') return;

        set({
            civilizations: state.civilizations.map((c, i) => {
                if (i !== 0) return c;
                return {
                    ...c,
                    units: c.units.map(u =>
                        u.id === unitId ? { ...u, position: { q: targetQ, r: targetR } } : u
                    ),
                };
            }),
            tiles: state.tiles.map(t => {
                const dist = Math.abs(t.q - targetQ) + Math.abs(t.r - targetR);
                if (dist <= 3 && t.fogState !== 'visible') {
                    return { ...t, fogState: 'visible' };
                }
                return t;
            }),
        });
    },

    // ── Era Advancement ───────────────────────────────
    advanceEra: () => {
        const state = get();
        const playerCiv = state.civilizations[0];
        if (!playerCiv.canAdvanceEra) return;

        const nextEra = getNextEra(playerCiv.eraIndex);
        if (!nextEra) return;

        const reqs = nextEra.requirements;
        let newResources = { ...playerCiv.resources };
        if (reqs.food) newResources.food -= reqs.food * 0.5;
        if (reqs.wood) newResources.wood -= reqs.wood * 0.5;
        if (reqs.stone) newResources.stone -= reqs.stone * 0.3;
        if (reqs.gold) newResources.gold -= reqs.gold * 0.3;

        trackEvent(GameEvents.ERA_ADVANCE, { era: nextEra.name, eraIndex: playerCiv.eraIndex + 1 });

        set({
            civilizations: state.civilizations.map((c, i) =>
                i === 0 ? { ...c, eraIndex: c.eraIndex + 1, resources: validateResourceValues(newResources), canAdvanceEra: false } : c
            ),
            research: state.research - (reqs.research || 0) * 0.5,
            notifications: [...state.notifications, {
                id: generateSecureId('notif'),
                type: 'era',
                message: `🏛️ A NEW AGE DAWNS! Welcome to the ${nextEra.name}! New buildings and units are now available.`,
                tick: state.tick,
                dismissed: false,
            }],
        });
    },

    // ── Game Over ─────────────────────────────────────
    /**
     * Triggers game over state.
     * @param {'victory'|'defeat'} result
     */
    triggerGameOver: (result) => {
        set({
            paused: true,
            gameOverState: result,
            screen: 'gameover',
        });
    },

    // ── Diplomacy ─────────────────────────────────────
    openDiplomacy: (leaderId) => set({ activeDiplomacy: leaderId, activePanel: 'diplomacy' }),
    closeDiplomacy: () => set({ activeDiplomacy: null }),

    /**
     * Sends a diplomacy message to the active AI leader.
     * Input is sanitized before processing.
     * @param {string} message - Raw player message
     */
    sendDiplomacyMessage: (message) => {
        const state = get();
        const leaderId = state.activeDiplomacy;
        if (!leaderId) return;

        // Sanitize input
        const cleanMessage = sanitizeInput(message);
        if (!cleanMessage) return;

        const parsed = parsePlayerMessage(cleanMessage);
        const playerCiv = state.civilizations[0];
        const aiCiv = state.civilizations.find(c => c.id === leaderId);

        const gameState = {
            diplomacyMemory: state.diplomacyMemory,
            relationships: {},
            playerMilitaryStrength: playerCiv.units.filter(u => u.type !== 'worker').length,
            aiMilitaryStrength: aiCiv ? aiCiv.units.filter(u => u.type !== 'worker').length : 0,
        };

        gameState.relationships[leaderId] = getRelationshipSummary(state.diplomacyMemory, leaderId);

        const result = evaluateDiplomacy(leaderId, parsed, gameState);

        const chat = { ...state.diplomacyChat };
        if (!chat[leaderId]) chat[leaderId] = [];
        chat[leaderId] = [
            ...chat[leaderId],
            { sender: 'player', message: cleanMessage, mood: 'neutral' },
            { sender: leaderId, message: result.response, mood: result.mood },
        ];

        let updatedMemory = { ...state.diplomacyMemory };
        let notifications = [...state.notifications];

        trackEvent(GameEvents.DIPLOMACY_SENT, { leader: leaderId, intent: parsed.intent });

        if (result.action) {
            switch (result.action.type) {
                case 'TRADE_ACCEPTED':
                    updatedMemory = recordDiplomacyEvent(updatedMemory, leaderId, { type: 'trade' });
                    notifications.push({
                        id: generateSecureId('notif'),
                        type: 'success',
                        message: `📦 Trade agreement reached with ${LEADER_PROFILES[leaderId]?.name}!`,
                        tick: state.tick,
                        dismissed: false,
                    });
                    break;
                case 'ALLIANCE_FORMED':
                    updatedMemory = recordDiplomacyEvent(updatedMemory, leaderId, { type: 'honored' });
                    notifications.push({
                        id: generateSecureId('notif'),
                        type: 'success',
                        message: `🤝 Alliance formed with ${LEADER_PROFILES[leaderId]?.name}!`,
                        tick: state.tick,
                        dismissed: false,
                    });
                    break;
                case 'DECLARE_WAR':
                    updatedMemory = recordDiplomacyEvent(updatedMemory, leaderId, { type: 'war' });
                    notifications.push({
                        id: generateSecureId('notif'),
                        type: 'danger',
                        message: `⚔️ ${LEADER_PROFILES[leaderId]?.name} has declared WAR!`,
                        tick: state.tick,
                        dismissed: false,
                    });
                    break;
                case 'PEACE_ACCEPTED':
                    updatedMemory = recordDiplomacyEvent(updatedMemory, leaderId, { type: 'peace' });
                    break;
                case 'RELATIONSHIP_BOOST':
                    updatedMemory = recordDiplomacyEvent(updatedMemory, leaderId, { type: 'compliment' });
                    break;
                case 'RELATIONSHIP_DROP':
                    updatedMemory = recordDiplomacyEvent(updatedMemory, leaderId, { type: 'insult' });
                    break;
            }
        }

        set({
            diplomacyChat: chat,
            diplomacyMemory: updatedMemory,
            notifications,
        });
    },

    // ── Save / Load ────────────────────────────────────
    /**
     * Saves the current game state to localStorage.
     * @returns {boolean} Whether save succeeded
     */
    saveGame: () => {
        const state = get();
        const serializable = {
            tick: state.tick,
            difficulty: state.difficulty,
            research: state.research,
            tiles: state.tiles,
            civilizations: state.civilizations,
            buildings: state.buildings,
            diplomacyMemory: state.diplomacyMemory,
            diplomacyChat: state.diplomacyChat,
            notifications: state.notifications,
            advisorSuggestions: state.advisorSuggestions,
            camera: state.camera,
        };
        const success = saveGameLocally(serializable);
        if (success) {
            set({
                notifications: [...state.notifications, {
                    id: generateSecureId('notif'),
                    type: 'success',
                    message: '💾 Game saved successfully!',
                    tick: state.tick,
                    dismissed: false,
                }],
            });
        }
        return success;
    },

    /**
     * Loads game state from localStorage.
     * @returns {boolean} Whether load succeeded
     */
    loadGame: () => {
        const saved = loadGameLocally();
        if (!saved) return false;

        set({
            ...saved,
            screen: 'game',
            paused: true,
            gameOverState: null,
            activePanel: null,
            buildMode: false,
            selectedBuildingType: null,
            selectedTile: null,
        });
        return true;
    },

    // ── Panels ────────────────────────────────────────
    setActivePanel: (panel) => set(s => ({
        activePanel: s.activePanel === panel ? null : panel,
    })),

    // ── Pause ─────────────────────────────────────────
    togglePause: () => set(s => ({ paused: !s.paused })),

    // ── Notifications ─────────────────────────────────
    dismissNotification: (id) => set(s => ({
        notifications: s.notifications.filter(n => n.id !== id),
    })),
}));

export default useGameStore;
