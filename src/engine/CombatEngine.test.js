import { describe, it, expect } from 'vitest';
import { resolveCombat, processAllCombat } from './CombatEngine.js';
import { TERRAIN } from './constants.js';

function makeUnit(overrides = {}) {
    return { id: 'u1', hp: 100, atk: 10, def: 5, unitType: 'infantry', position: { q: 0, r: 0 }, ...overrides };
}

describe('CombatEngine', () => {
    // ── resolveCombat ─────────────────────────────────────────
    describe('resolveCombat', () => {
        it('returns correct structure', () => {
            const result = resolveCombat(makeUnit(), makeUnit({ id: 'u2' }), TERRAIN.PLAINS, TERRAIN.PLAINS);
            expect(result).toHaveProperty('attackerDamage');
            expect(result).toHaveProperty('defenderDamage');
            expect(result).toHaveProperty('attackerSurvived');
            expect(result).toHaveProperty('defenderSurvived');
            expect(result).toHaveProperty('attackerHp');
            expect(result).toHaveProperty('defenderHp');
        });

        it('deals at least 1 damage regardless of stats', () => {
            const tank = makeUnit({ atk: 0, def: 999 });
            const result = resolveCombat(makeUnit(), tank, TERRAIN.PLAINS, TERRAIN.PLAINS);
            expect(result.defenderDamage).toBeGreaterThanOrEqual(1);
        });

        it('applies type advantage (infantry vs cavalry → disadvantage for attacker)', () => {
            const infantry = makeUnit({ unitType: 'infantry', atk: 10, def: 5 });
            const cavalry = makeUnit({ id: 'u2', unitType: 'cavalry', atk: 10, def: 5 });
            const result = resolveCombat(infantry, cavalry, TERRAIN.PLAINS, TERRAIN.PLAINS);
            // Infantry has 0.7x advantage vs cavalry = less damage
            // Compare with equal type matchup
            const neutral = resolveCombat(infantry, makeUnit({ id: 'u3', unitType: 'infantry', atk: 10, def: 5 }), TERRAIN.PLAINS, TERRAIN.PLAINS);
            expect(result.defenderDamage).toBeLessThanOrEqual(neutral.defenderDamage);
        });

        it('forest terrain gives defender a bonus', () => {
            const attacker = makeUnit({ atk: 10, def: 5 });
            const defender = makeUnit({ id: 'u2', atk: 10, def: 5 });
            const forestResult = resolveCombat(attacker, defender, TERRAIN.PLAINS, TERRAIN.FOREST);
            const plainsResult = resolveCombat(attacker, defender, TERRAIN.PLAINS, TERRAIN.PLAINS);
            // Forest defender takes less damage (higher terrain def bonus)
            expect(forestResult.defenderDamage).toBeLessThanOrEqual(plainsResult.defenderDamage);
        });

        it('mountain terrain gives defender a bonus', () => {
            const attacker = makeUnit({ atk: 10, def: 5 });
            const defender = makeUnit({ id: 'u2', atk: 10, def: 5 });
            const mtnResult = resolveCombat(attacker, defender, TERRAIN.PLAINS, TERRAIN.MOUNTAIN);
            const plainsResult = resolveCombat(attacker, defender, TERRAIN.PLAINS, TERRAIN.PLAINS);
            expect(mtnResult.defenderDamage).toBeLessThanOrEqual(plainsResult.defenderDamage);
        });

        it('desert terrain gives defender a penalty', () => {
            const attacker = makeUnit({ atk: 10, def: 5 });
            const defender = makeUnit({ id: 'u2', atk: 10, def: 5 });
            const desertResult = resolveCombat(attacker, defender, TERRAIN.PLAINS, TERRAIN.DESERT);
            const plainsResult = resolveCombat(attacker, defender, TERRAIN.PLAINS, TERRAIN.PLAINS);
            expect(desertResult.defenderDamage).toBeGreaterThanOrEqual(plainsResult.defenderDamage);
        });

        it('one-shot kills mark survived = false', () => {
            const strong = makeUnit({ atk: 500, def: 0 });
            const weak = makeUnit({ id: 'u2', hp: 10, atk: 1, def: 0 });
            const result = resolveCombat(strong, weak, TERRAIN.PLAINS, TERRAIN.PLAINS);
            expect(result.defenderSurvived).toBe(false);
            expect(result.defenderHp).toBe(0);
        });

        it('handles null terrain gracefully', () => {
            const result = resolveCombat(makeUnit(), makeUnit({ id: 'u2' }), null, null);
            expect(result).toBeDefined();
            expect(typeof result.attackerDamage).toBe('number');
        });
    });

    // ── processAllCombat ──────────────────────────────────────
    describe('processAllCombat', () => {
        it('returns empty array when no units are adjacent', () => {
            const civs = [
                { id: 'player', units: [makeUnit({ position: { q: 0, r: 0 } })] },
                { id: 'ai1', units: [makeUnit({ id: 'a1', position: { q: 10, r: 10 } })] },
            ];
            expect(processAllCombat(civs, [])).toEqual([]);
        });

        it('resolves combat when enemy units share a tile', () => {
            const civs = [
                { id: 'player', units: [makeUnit({ position: { q: 5, r: 5 } })] },
                { id: 'ai1', units: [makeUnit({ id: 'a1', position: { q: 5, r: 5 } })] },
            ];
            const tiles = [{ q: 5, r: 5, terrain: TERRAIN.PLAINS }];
            const results = processAllCombat(civs, tiles);
            expect(results.length).toBe(1);
            expect(results[0]).toHaveProperty('attackerCivId');
            expect(results[0]).toHaveProperty('defenderCivId');
        });

        it('skips workers and scouts', () => {
            const civs = [
                { id: 'player', units: [makeUnit({ unitType: 'worker', position: { q: 5, r: 5 } })] },
                { id: 'ai1', units: [makeUnit({ id: 'a1', unitType: 'scout', position: { q: 5, r: 5 } })] },
            ];
            expect(processAllCombat(civs, [])).toEqual([]);
        });

        it('handles multiple combats on different tiles', () => {
            const civs = [
                {
                    id: 'player', units: [
                        makeUnit({ id: 'p1', position: { q: 0, r: 0 } }),
                        makeUnit({ id: 'p2', position: { q: 5, r: 5 } }),
                    ]
                },
                {
                    id: 'ai1', units: [
                        makeUnit({ id: 'a1', position: { q: 0, r: 0 } }),
                        makeUnit({ id: 'a2', position: { q: 5, r: 5 } }),
                    ]
                },
            ];
            const tiles = [
                { q: 0, r: 0, terrain: TERRAIN.PLAINS },
                { q: 5, r: 5, terrain: TERRAIN.FOREST },
            ];
            const results = processAllCombat(civs, tiles);
            expect(results.length).toBe(2);
        });

        it('returns no combat for units of the same civ', () => {
            const civs = [
                {
                    id: 'player', units: [
                        makeUnit({ id: 'p1', position: { q: 5, r: 5 } }),
                        makeUnit({ id: 'p2', position: { q: 5, r: 5 } }),
                    ]
                },
            ];
            expect(processAllCombat(civs, [])).toEqual([]);
        });
    });
});
