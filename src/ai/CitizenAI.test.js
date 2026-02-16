import { describe, it, expect, vi } from 'vitest';
import { calculateMorale, generateAdvisorSuggestions, autoAssignIdleWorkers, checkForUnrest, growSkills } from './CitizenAI.js';
import { TERRAIN } from '../engine/constants.js';

function makeCiv(overrides = {}) {
    return {
        id: 'player',
        resources: { food: 200, wood: 100, stone: 50, gold: 20 },
        units: [
            { id: 'w1', type: 'worker', task: 'gather', position: { q: 0, r: 0 } },
            { id: 'w2', type: 'worker', task: 'gather', position: { q: 1, r: 0 } },
            { id: 'w3', type: 'worker', task: 'gather', position: { q: 2, r: 0 } },
        ],
        morale: 70,
        eraIndex: 1,
        atWar: false,
        recentCasualties: 0,
        recentVictories: 0,
        canAdvanceEra: false,
        ...overrides,
    };
}

describe('CitizenAI', () => {
    // ── calculateMorale ───────────────────────────────────────
    describe('calculateMorale', () => {
        it('returns a value between 0 and 100', () => {
            const morale = calculateMorale(makeCiv(), []);
            expect(morale).toBeGreaterThanOrEqual(0);
            expect(morale).toBeLessThanOrEqual(100);
        });

        it('high food per capita increases morale', () => {
            const rich = makeCiv({ resources: { food: 1000, wood: 0, stone: 0, gold: 0 } });
            const poor = makeCiv({ resources: { food: 1, wood: 0, stone: 0, gold: 0 } });
            expect(calculateMorale(rich, [])).toBeGreaterThan(calculateMorale(poor, []));
        });

        it('overcrowding decreases morale', () => {
            const units = Array.from({ length: 20 }, (_, i) => ({ id: `u${i}`, type: 'worker' }));
            const crowded = makeCiv({ units });
            const spacious = makeCiv({ units: [{ id: 'u1', type: 'worker' }] });
            const buildings = [{ civId: 'player', type: 'house', progress: 1 }]; // only 1 house = 10 cap
            expect(calculateMorale(crowded, buildings)).toBeLessThan(calculateMorale(spacious, buildings));
        });

        it('temples increase morale', () => {
            const base = calculateMorale(makeCiv(), []);
            const withTemple = calculateMorale(makeCiv(), [{ civId: 'player', type: 'temple', progress: 1 }]);
            expect(withTemple).toBeGreaterThan(base);
        });

        it('war weariness decreases morale', () => {
            const peaceful = calculateMorale(makeCiv({ atWar: false }), []);
            const warring = calculateMorale(makeCiv({ atWar: true }), []);
            expect(warring).toBeLessThan(peaceful);
        });

        it('recent casualties decrease morale', () => {
            const noCasualties = calculateMorale(makeCiv({ recentCasualties: 0 }), []);
            const casualties = calculateMorale(makeCiv({ recentCasualties: 5 }), []);
            expect(casualties).toBeLessThan(noCasualties);
        });

        it('recent victories increase morale', () => {
            const noVictory = calculateMorale(makeCiv({ recentVictories: 0 }), []);
            const victory = calculateMorale(makeCiv({ recentVictories: 3 }), []);
            expect(victory).toBeGreaterThan(noVictory);
        });
    });

    // ── generateAdvisorSuggestions ─────────────────────────────
    describe('generateAdvisorSuggestions', () => {
        it('warns when food is critically low', () => {
            const civ = makeCiv({ resources: { food: 10, wood: 100, stone: 50, gold: 20 } });
            const suggestions = generateAdvisorSuggestions(civ, [], [], null);
            const foodWarning = suggestions.find(s => s.action === 'BUILD_FARM');
            expect(foodWarning).toBeDefined();
            expect(foodWarning.type).toBe('critical');
        });

        it('warns when wood is low', () => {
            const civ = makeCiv({ resources: { food: 200, wood: 10, stone: 50, gold: 20 } });
            const suggestions = generateAdvisorSuggestions(civ, [], [], null);
            expect(suggestions.find(s => s.action === 'BUILD_LUMBER_CAMP')).toBeDefined();
        });

        it('suggests military when no military exists', () => {
            const civ = makeCiv({
                units: [{ id: 'w1', type: 'worker' }],
                eraIndex: 1,
            });
            const suggestions = generateAdvisorSuggestions(civ, [], [], null);
            expect(suggestions.find(s => s.action === 'TRAIN_MILITARY')).toBeDefined();
        });

        it('alerts when enemies are nearby', () => {
            const civ = makeCiv();
            const suggestions = generateAdvisorSuggestions(civ, [], [], { nearbyEnemies: 3 });
            expect(suggestions.find(s => s.action === 'ALERT')).toBeDefined();
        });

        it('suggests era advancement when possible', () => {
            const civ = makeCiv({ canAdvanceEra: true });
            const suggestions = generateAdvisorSuggestions(civ, [], [], null);
            expect(suggestions.find(s => s.action === 'ADVANCE_ERA')).toBeDefined();
        });

        it('warns about low morale', () => {
            const civ = makeCiv({ morale: 20 });
            const suggestions = generateAdvisorSuggestions(civ, [], [], null);
            expect(suggestions.find(s => s.action === 'IMPROVE_MORALE')).toBeDefined();
        });

        it('celebrates high morale', () => {
            const civ = makeCiv({ morale: 90 });
            const suggestions = generateAdvisorSuggestions(civ, [], [], null);
            expect(suggestions.find(s => s.type === 'positive')).toBeDefined();
        });
    });

    // ── autoAssignIdleWorkers ─────────────────────────────────
    describe('autoAssignIdleWorkers', () => {
        const tiles = [
            { q: 0, r: 0, terrain: TERRAIN.FOREST, resourcesRemaining: 100 },
            { q: 1, r: 0, terrain: TERRAIN.PLAINS, resourcesRemaining: 100 },
            { q: 2, r: 0, terrain: TERRAIN.WATER, resourcesRemaining: 100 },
        ];

        it('assigns idle workers to gather', () => {
            const units = [{ id: 'w1', civId: 'player', type: 'worker', task: 'idle', position: { q: 0, r: 0 } }];
            const result = autoAssignIdleWorkers(units, tiles, [], 'player');
            expect(result.length).toBe(1);
            expect(result[0].task).toBe('gather');
        });

        it('returns empty when no idle workers', () => {
            const units = [{ id: 'w1', civId: 'player', type: 'worker', task: 'gather', position: { q: 0, r: 0 } }];
            const result = autoAssignIdleWorkers(units, tiles, [], 'player');
            expect(result.length).toBe(0);
        });

        it('skips water tiles', () => {
            const units = [{ id: 'w1', civId: 'player', type: 'worker', task: 'idle', position: { q: 2, r: 0 } }];
            const waterOnlyTiles = [{ q: 2, r: 0, terrain: TERRAIN.WATER, resourcesRemaining: 100 }];
            const result = autoAssignIdleWorkers(units, waterOnlyTiles, [], 'player');
            // No valid target, so no assignment
            expect(result.length).toBe(0);
        });

        it('only assigns workers belonging to the specified civ', () => {
            const units = [
                { id: 'w1', civId: 'player', type: 'worker', task: 'idle', position: { q: 0, r: 0 } },
                { id: 'w2', civId: 'ai1', type: 'worker', task: 'idle', position: { q: 0, r: 0 } },
            ];
            const result = autoAssignIdleWorkers(units, tiles, [], 'player');
            expect(result.length).toBe(1);
            expect(result[0].unitId).toBe('w1');
        });
    });

    // ── checkForUnrest ────────────────────────────────────────
    describe('checkForUnrest', () => {
        it('returns null when morale is above 40', () => {
            expect(checkForUnrest(50, 10)).toBeNull();
            expect(checkForUnrest(100, 10)).toBeNull();
        });

        it('can return unrest event when morale is below 40', () => {
            // Mock Math.random to force unrest
            vi.spyOn(Math, 'random').mockReturnValue(0);
            const result = checkForUnrest(30, 10);
            expect(result).not.toBeNull();
            expect(result.type).toBe('unrest');
            vi.restoreAllMocks();
        });

        it('returns revolt when morale is critically low', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0);
            const result = checkForUnrest(10, 20);
            expect(result).not.toBeNull();
            expect(result.type).toBe('revolt');
            expect(result.effect.deserters).toBeGreaterThan(0);
            vi.restoreAllMocks();
        });

        it('can return null even at low morale (randomness)', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0.99);
            expect(checkForUnrest(35, 10)).toBeNull();
            vi.restoreAllMocks();
        });
    });

    // ── growSkills ────────────────────────────────────────────
    describe('growSkills', () => {
        it('increases gathering skill for workers on gather task', () => {
            const units = [{ id: 'w1', type: 'worker', task: 'gather', skills: { gathering: 0 } }];
            const result = growSkills(units);
            expect(result[0].skills.gathering).toBeGreaterThan(0);
        });

        it('increases building skill for workers on build task', () => {
            const units = [{ id: 'w1', type: 'worker', task: 'build', skills: { building: 0 } }];
            const result = growSkills(units);
            expect(result[0].skills.building).toBeGreaterThan(0);
        });

        it('increases fighting skill for military units', () => {
            const units = [{ id: 'm1', type: 'infantry', task: null, skills: { fighting: 0 } }];
            const result = growSkills(units);
            expect(result[0].skills.fighting).toBeGreaterThan(0);
        });

        it('caps skills at 10', () => {
            const units = [{ id: 'w1', type: 'worker', task: 'gather', skills: { gathering: 9.999 } }];
            const result = growSkills(units);
            expect(result[0].skills.gathering).toBeLessThanOrEqual(10);
        });

        it('initializes skills for units without them', () => {
            const units = [{ id: 'w1', type: 'worker', task: 'gather' }];
            const result = growSkills(units);
            expect(result[0].skills).toBeDefined();
            expect(result[0].skills.gathering).toBeGreaterThan(0);
        });
    });
});
