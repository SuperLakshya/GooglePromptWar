import { describe, it, expect } from 'vitest';
import { gatherResources, canAfford, spendResources, addResources, consumeFood } from './ResourceManager.js';
import { TERRAIN, BUILDINGS } from './constants.js';

// Helper to create a minimal civ object
function makeCiv(overrides = {}) {
    return {
        id: 'player',
        morale: 100,
        units: [],
        ...overrides,
    };
}

// Helper to create a tile
function makeTile(q, r, terrain = TERRAIN.PLAINS, overrides = {}) {
    return { q, r, terrain, owner: null, building: null, units: [], resourcesRemaining: 100, ...overrides };
}

// Helper to create a worker unit
function makeWorker(q, r, overrides = {}) {
    return { id: 'w1', type: 'worker', task: 'gather', position: { q, r }, skills: { gathering: 0 }, ...overrides };
}

describe('ResourceManager', () => {
    // ── gatherResources ───────────────────────────────────────
    describe('gatherResources', () => {
        it('gathers resources from terrain when workers are assigned', () => {
            const civ = makeCiv({ units: [makeWorker(0, 0)] });
            const tiles = [makeTile(0, 0, TERRAIN.FOREST)];
            const result = gatherResources(civ, tiles, []);
            expect(result.wood).toBeGreaterThan(0);
            expect(result.food).toBeGreaterThan(0); // forest has food: 1
        });

        it('returns zero resources when no workers exist', () => {
            const civ = makeCiv({ units: [] });
            const tiles = [makeTile(0, 0)];
            const result = gatherResources(civ, tiles, []);
            expect(result.food).toBe(0);
            expect(result.wood).toBe(0);
            expect(result.stone).toBe(0);
            expect(result.gold).toBe(0);
        });

        it('applies building gather bonuses', () => {
            const civ = makeCiv({ units: [makeWorker(0, 0)] });
            const tiles = [makeTile(0, 0, TERRAIN.FOREST)];
            // Find a building type with gatherBonus
            const buildingType = Object.keys(BUILDINGS).find(k => {
                const b = BUILDINGS[k];
                return b.gatherBonus && Object.keys(b.gatherBonus).length > 0;
            });
            if (!buildingType) return; // skip if no building has gather bonus
            const building = { type: buildingType, civId: 'player', progress: 1 };
            const withBonus = gatherResources(civ, tiles, [building]);
            const withoutBonus = gatherResources(civ, tiles, []);
            // At least one resource should be higher with bonus
            const bonusKeys = Object.keys(BUILDINGS[buildingType].gatherBonus);
            for (const key of bonusKeys) {
                expect(withBonus[key]).toBeGreaterThanOrEqual(withoutBonus[key]);
            }
        });

        it('does not gather from depleted tiles', () => {
            const civ = makeCiv({ units: [makeWorker(0, 0)] });
            const tiles = [makeTile(0, 0, TERRAIN.FOREST, { resourcesRemaining: 0 })];
            const result = gatherResources(civ, tiles, []);
            // wood and food from worker should be 0 (farms still generate passive food)
            expect(result.wood).toBe(0);
        });

        it('scales gathering by morale', () => {
            const highMorale = makeCiv({ morale: 100, units: [makeWorker(0, 0)] });
            const lowMorale = makeCiv({ morale: 50, units: [makeWorker(0, 0)] });
            const tiles = [makeTile(0, 0, TERRAIN.FOREST)];
            const high = gatherResources(highMorale, tiles, []);
            const low = gatherResources(lowMorale, tiles, []);
            expect(high.wood).toBeGreaterThan(low.wood);
        });

        it('scales gathering by worker skill level', () => {
            const skilled = makeCiv({ units: [makeWorker(0, 0, { skills: { gathering: 5 } })] });
            const unskilled = makeCiv({ units: [makeWorker(0, 0, { skills: { gathering: 0 } })] });
            const tiles = [makeTile(0, 0, TERRAIN.FOREST)];
            const s = gatherResources(skilled, tiles, []);
            const u = gatherResources(unskilled, tiles, []);
            expect(s.wood).toBeGreaterThan(u.wood);
        });

        it('generates passive food from farms', () => {
            const civ = makeCiv({ units: [] });
            const tiles = [makeTile(0, 0)];
            const farms = [{ type: 'farm', civId: 'player', progress: 1 }];
            const result = gatherResources(civ, tiles, farms);
            expect(result.food).toBeGreaterThan(0);
        });
    });

    // ── canAfford ─────────────────────────────────────────────
    describe('canAfford', () => {
        it('returns true when resources are sufficient', () => {
            expect(canAfford({ food: 100, wood: 100 }, { food: 50, wood: 50 })).toBe(true);
        });

        it('returns false when a single resource is insufficient', () => {
            expect(canAfford({ food: 10, wood: 100 }, { food: 50, wood: 50 })).toBe(false);
        });

        it('returns true for zero-cost items', () => {
            expect(canAfford({ food: 0 }, {})).toBe(true);
        });

        it('returns false when multiple resources are insufficient', () => {
            expect(canAfford({ food: 10, wood: 10 }, { food: 50, wood: 50 })).toBe(false);
        });
    });

    // ── spendResources ────────────────────────────────────────
    describe('spendResources', () => {
        it('deducts cost from resources', () => {
            const result = spendResources({ food: 100, wood: 80 }, { food: 30, wood: 20 });
            expect(result.food).toBe(70);
            expect(result.wood).toBe(60);
        });

        it('can result in negative values (caller must validate)', () => {
            const result = spendResources({ food: 10 }, { food: 50 });
            expect(result.food).toBe(-40);
        });
    });

    // ── addResources ──────────────────────────────────────────
    describe('addResources', () => {
        it('adds gathered resources to current', () => {
            const result = addResources({ food: 50, wood: 50 }, { food: 10, wood: 20 });
            expect(result.food).toBe(60);
            expect(result.wood).toBe(70);
        });
    });

    // ── consumeFood ───────────────────────────────────────────
    describe('consumeFood', () => {
        it('consumes food based on unit count', () => {
            const result = consumeFood({ food: 100 }, 10);
            expect(result.food).toBe(97); // 10 * 0.3 = 3
        });

        it('floors food at zero', () => {
            const result = consumeFood({ food: 1 }, 100);
            expect(result.food).toBe(0);
        });

        it('consumes nothing for zero units', () => {
            const result = consumeFood({ food: 100 }, 0);
            expect(result.food).toBe(100);
        });
    });
});
