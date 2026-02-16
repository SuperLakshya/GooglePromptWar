/**
 * @module GameEngine
 * @description Core game engine orchestrator. Runs the tick loop and coordinates
 * all game systems: resource gathering, construction, research, citizen AI,
 * warfare AI, combat resolution, AI attacks, and victory/defeat checks.
 */

import { gatherResources, consumeFood, addResources } from './ResourceManager.js';
import { processAllCombat } from './CombatEngine.js';
import { canAdvanceEra } from './EraSystem.js';
import { calculateMorale, generateAdvisorSuggestions, autoAssignIdleWorkers, checkForUnrest, growSkills } from '../ai/CitizenAI.js';
import { observePlayerUnits, analyzePlayerStrategy, getCounterStrategy, decideAIActions } from '../ai/WarfareAI.js';
import { BUILDINGS, UNITS, TICK_MS, MAP_COLS, MAP_ROWS } from './constants.js';
import { getDifficultySettings } from './DifficultyConfig.js';
import { generateSecureId } from '../utils/security.js';

/** @type {number|null} */
let tickInterval = null;

/**
 * Starts the main game loop using setInterval.
 * @param {import('zustand').StoreApi} store - Zustand store reference
 * @returns {Function} Cleanup function to stop the loop
 */
export function startGameLoop(store) {
    if (tickInterval) clearInterval(tickInterval);

    tickInterval = setInterval(() => {
        const state = store.getState();
        if (state.paused || state.screen !== 'game') return;
        processTick(store);
    }, TICK_MS);

    return () => clearInterval(tickInterval);
}

/**
 * Stops the game loop.
 */
export function stopGameLoop() {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
}

/**
 * Moves AI military units toward a target position (used for attacks).
 * Units move 1 hex closer each tick they're assigned to attack.
 *
 * @param {Array} units - AI civ's units
 * @param {Object} targetPos - Target position { q, r }
 * @param {number} groupSize - How many units to send in attack wave
 * @returns {Array} Updated units with adjusted positions
 */
function moveAttackGroup(units, targetPos, groupSize) {
    const military = units.filter(u => u.type !== 'worker' && u.task !== 'guard');
    const attackers = military.slice(0, groupSize);

    return units.map(u => {
        const isAttacker = attackers.some(a => a.id === u.id);
        if (!isAttacker) return u;

        // Move 1 step closer to target
        const dq = Math.sign(targetPos.q - u.position.q);
        const dr = Math.sign(targetPos.r - u.position.r);
        const newQ = Math.max(0, Math.min(MAP_COLS - 1, u.position.q + dq));
        const newR = Math.max(0, Math.min(MAP_ROWS - 1, u.position.r + dr));

        return { ...u, position: { q: newQ, r: newR }, task: 'attack' };
    });
}

/**
 * Main game tick processor. Runs all game phases in order.
 * @param {import('zustand').StoreApi} store - Zustand store reference
 */
function processTick(store) {
    const state = store.getState();
    const tick = state.tick + 1;
    const diffSettings = getDifficultySettings(state.difficulty);

    // ── 1. Resource Gathering ─────────────────────────
    const playerCiv = state.civilizations[0];
    const gathered = gatherResources(playerCiv, state.tiles, state.buildings);

    // Apply player resource bonus from difficulty
    for (const key of Object.keys(gathered)) {
        gathered[key] = Math.floor(gathered[key] * diffSettings.playerResourceBonus);
    }

    let newResources = addResources(playerCiv.resources, gathered);
    newResources = consumeFood(newResources, playerCiv.units.length);

    // ── 2. Construction Progress ──────────────────────
    const updatedBuildings = state.buildings.map(b => {
        if (b.progress < 1) {
            const speed = 1 / (BUILDINGS[b.type]?.buildTime || 20);
            return { ...b, progress: Math.min(1, b.progress + speed) };
        }
        return b;
    });

    // ── 3. Research Progress ──────────────────────────
    let research = state.research;
    const universities = updatedBuildings.filter(
        b => b.civId === 'player' && b.progress >= 1 && (b.type === 'university' || b.type === 'academy')
    );
    const researchRate = 0.5 + universities.length * 1.5;
    research += researchRate;

    // ── 4. Citizen AI (every 4 ticks = 1 second) ─────
    let morale = playerCiv.morale;
    let suggestions = state.advisorSuggestions;
    let notifications = [...state.notifications];
    let updatedPlayerUnits = [...playerCiv.units];

    if (tick % 4 === 0) {
        morale = calculateMorale(
            { ...playerCiv, resources: newResources },
            updatedBuildings
        );

        const assignments = autoAssignIdleWorkers(updatedPlayerUnits, state.tiles, updatedBuildings, 'player');
        for (const a of assignments) {
            const unit = updatedPlayerUnits.find(u => u.id === a.unitId);
            if (unit) {
                unit.task = a.task;
                unit.targetPosition = a.target;
            }
        }

        updatedPlayerUnits = growSkills(updatedPlayerUnits);
    }

    // ── 5. Advisor suggestions (every 20 ticks = 5s) ─
    if (tick % 20 === 0) {
        const enemyData = {
            nearbyEnemies: state.civilizations.slice(1).reduce((sum, c) => {
                const nearUnits = c.units.filter(u => {
                    const dist = Math.abs(u.position.q - playerCiv.homePosition.q) + Math.abs(u.position.r - playerCiv.homePosition.r);
                    return dist < 8;
                });
                return sum + nearUnits.length;
            }, 0),
        };

        const civState = {
            ...playerCiv,
            resources: newResources,
            morale,
            canAdvanceEra: canAdvanceEra(newResources, research, playerCiv.eraIndex),
        };
        suggestions = generateAdvisorSuggestions(civState, state.tiles, updatedBuildings, enemyData);

        const unrest = checkForUnrest(morale, updatedPlayerUnits.length);
        if (unrest) {
            notifications.push({
                id: generateSecureId('notif'),
                type: 'danger',
                message: unrest.message,
                tick,
                dismissed: false,
            });
        }
    }

    // ── 6. AI Civilizations (every 8 ticks = 2s) ─────
    let updatedAICivs = state.civilizations.slice(1).map(aiCiv => {
        if (tick % 8 !== 0) return aiCiv;

        // AI Resource gathering with difficulty multiplier
        const aiGathered = gatherResources(aiCiv, state.tiles, updatedBuildings);
        for (const key of Object.keys(aiGathered)) {
            aiGathered[key] = Math.floor(aiGathered[key] * diffSettings.aiResourceMultiplier);
        }
        let aiResources = addResources(aiCiv.resources, aiGathered);
        aiResources = consumeFood(aiResources, aiCiv.units.length);

        // AI warfare adaptation
        let tracker = aiCiv.warfareTracker;
        tracker = observePlayerUnits(tracker, updatedPlayerUnits, tick);
        tracker = analyzePlayerStrategy(tracker);
        const counter = getCounterStrategy(tracker);

        // AI decides actions (train units up to difficulty max)
        const actions = decideAIActions(
            { ...aiCiv, resources: aiResources },
            counter,
            state
        );

        let aiUnits = [...aiCiv.units];

        for (const action of actions) {
            if (action.type === 'TRAIN_UNIT' && aiUnits.length < diffSettings.aiMaxMilitary) {
                for (const [res, amt] of Object.entries(action.cost)) {
                    aiResources[res] = (aiResources[res] || 0) - amt;
                }
                const def = UNITS[action.unitType];
                if (def) {
                    aiUnits.push({
                        id: generateSecureId('ai'),
                        type: def.type,
                        unitType: def.type,
                        name: def.name,
                        hp: def.hp,
                        maxHp: def.hp,
                        atk: def.atk,
                        def: def.def,
                        speed: def.speed,
                        range: def.range,
                        position: { ...aiCiv.homePosition },
                        civId: aiCiv.id,
                        task: 'idle',
                        icon: def.icon,
                    });
                }
            }
        }

        // ── AI ATTACK LOGIC (difficulty-driven) ──────────
        const ticksSinceLastAttack = tick - (aiCiv.lastAttackTick || 0);
        const militaryCount = aiUnits.filter(u => u.type !== 'worker').length;
        const shouldAttack = ticksSinceLastAttack >= diffSettings.aiAggressionTimer && militaryCount >= 2;

        let lastAttackTick = aiCiv.lastAttackTick || 0;

        if (shouldAttack) {
            // Move military units toward player home
            aiUnits = moveAttackGroup(aiUnits, playerCiv.homePosition, diffSettings.aiAttackGroupSize);
            lastAttackTick = tick;

            notifications.push({
                id: generateSecureId('notif'),
                type: 'danger',
                message: `⚠️ ${aiCiv.name} is sending troops toward your territory!`,
                tick,
                dismissed: false,
            });
        }

        // Notify player of AI adaptation
        if (counter.notification && counter.strategy !== aiCiv.lastNotifiedStrategy) {
            notifications.push({
                id: generateSecureId('notif'),
                type: 'warning',
                message: counter.notification,
                tick,
                dismissed: false,
            });
        }

        return {
            ...aiCiv,
            resources: aiResources,
            units: aiUnits,
            warfareTracker: tracker,
            currentStrategy: counter.strategy,
            lastNotifiedStrategy: counter.notification ? counter.strategy : aiCiv.lastNotifiedStrategy,
            lastAttackTick,
        };
    });

    // ── 7. Combat Resolution ──────────────────────────
    const allCivs = [{ ...playerCiv, units: updatedPlayerUnits }, ...updatedAICivs];
    const combatResults = processAllCombat(allCivs, state.tiles);

    for (const result of combatResults) {
        if (!result.attackerSurvived) {
            if (result.attackerCivId === 'player') {
                updatedPlayerUnits = updatedPlayerUnits.filter(u => u.id !== result.attackerId);
            } else {
                updatedAICivs = updatedAICivs.map(c => c.id === result.attackerCivId
                    ? { ...c, units: c.units.filter(u => u.id !== result.attackerId) }
                    : c
                );
            }
        } else {
            const updateHp = (units, id, hp) => units.map(u => u.id === id ? { ...u, hp } : u);
            if (result.attackerCivId === 'player') {
                updatedPlayerUnits = updateHp(updatedPlayerUnits, result.attackerId, result.attackerHp);
            }
        }

        if (!result.defenderSurvived) {
            if (result.defenderCivId === 'player') {
                updatedPlayerUnits = updatedPlayerUnits.filter(u => u.id !== result.defenderId);
            } else {
                updatedAICivs = updatedAICivs.map(c => c.id === result.defenderCivId
                    ? { ...c, units: c.units.filter(u => u.id !== result.defenderId) }
                    : c
                );
            }
        } else {
            const updateHp = (units, id, hp) => units.map(u => u.id === id ? { ...u, hp } : u);
            if (result.defenderCivId === 'player') {
                updatedPlayerUnits = updateHp(updatedPlayerUnits, result.defenderId, result.defenderHp);
            }
        }

        notifications.push({
            id: generateSecureId('notif'),
            type: 'combat',
            message: `⚔️ Battle at (${result.position.q}, ${result.position.r})! ${result.attackerSurvived ? 'Attacker survived' : 'Attacker fell'}. ${result.defenderSurvived ? 'Defender survived' : 'Defender fell'}.`,
            tick,
            dismissed: false,
        });
    }

    // ── 8. Building Damage (AI attacks on buildings) ──
    const finalBuildings = updatedBuildings.map(b => {
        if (b.civId !== 'player') return b;

        // Check if any enemy unit is on this building's tile
        const enemies = updatedAICivs.flatMap(c => c.units)
            .filter(u => u.position.q === b.position.q && u.position.r === b.position.r && u.type !== 'worker');

        if (enemies.length > 0) {
            const totalDamage = enemies.reduce((sum, u) => sum + (u.atk || 3), 0);
            const newHp = b.hp - totalDamage;

            if (newHp <= 0) {
                notifications.push({
                    id: generateSecureId('notif'),
                    type: 'danger',
                    message: `🔥 ${BUILDINGS[b.type]?.name || 'Building'} at (${b.position.q}, ${b.position.r}) has been destroyed!`,
                    tick,
                    dismissed: false,
                });
                return null; // Mark for removal
            }
            return { ...b, hp: newHp };
        }
        return b;
    }).filter(Boolean);

    // Trim notifications to last 15
    if (notifications.length > 15) {
        notifications = notifications.slice(-15);
    }

    // ── 9. Era Check ──────────────────────────────────
    const canAdvance = canAdvanceEra(newResources, research, playerCiv.eraIndex);

    // ── 10. Victory / Defeat Check ────────────────────
    const playerTCs = finalBuildings.filter(b => b.type === 'townCenter' && b.civId === 'player');
    const aiTCs = finalBuildings.filter(b => b.type === 'townCenter' && b.civId !== 'player');

    if (playerTCs.length === 0) {
        // Player lost their town center — DEFEAT
        store.setState({
            tick,
            research,
            buildings: finalBuildings,
            notifications,
            advisorSuggestions: suggestions,
            civilizations: [
                { ...playerCiv, resources: newResources, units: updatedPlayerUnits, morale, canAdvanceEra: canAdvance },
                ...updatedAICivs,
            ],
        });
        store.getState().triggerGameOver('defeat');
        return;
    }

    if (aiTCs.length === 0 && tick > 40) {
        // All AI town centers destroyed — VICTORY
        store.setState({
            tick,
            research,
            buildings: finalBuildings,
            notifications,
            advisorSuggestions: suggestions,
            civilizations: [
                { ...playerCiv, resources: newResources, units: updatedPlayerUnits, morale, canAdvanceEra: canAdvance },
                ...updatedAICivs,
            ],
        });
        store.getState().triggerGameOver('victory');
        return;
    }

    // ── Update State ──────────────────────────────────
    store.setState({
        tick,
        research,
        buildings: finalBuildings,
        notifications,
        advisorSuggestions: suggestions,
        civilizations: [
            {
                ...playerCiv,
                resources: newResources,
                units: updatedPlayerUnits,
                morale,
                canAdvanceEra: canAdvance,
            },
            ...updatedAICivs,
        ],
    });
}
