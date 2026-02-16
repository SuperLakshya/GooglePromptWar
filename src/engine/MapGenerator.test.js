import { describe, it, expect } from 'vitest';
import { generateMap, getTile, setTile, findStartPositions } from './MapGenerator.js';
import { MAP_COLS, MAP_ROWS } from './constants.js';

describe('MapGenerator', () => {
    // ── generateMap ───────────────────────────────────────────
    describe('generateMap', () => {
        it('generates the correct number of tiles', () => {
            const tiles = generateMap(42);
            expect(tiles.length).toBe(MAP_COLS * MAP_ROWS);
        });

        it('is deterministic with the same seed', () => {
            const a = generateMap(12345);
            const b = generateMap(12345);
            for (let i = 0; i < a.length; i++) {
                expect(a[i].terrain.id).toBe(b[i].terrain.id);
            }
        });

        it('all tiles have required properties', () => {
            const tiles = generateMap(99);
            for (const tile of tiles) {
                expect(tile).toHaveProperty('q');
                expect(tile).toHaveProperty('r');
                expect(tile).toHaveProperty('terrain');
                expect(tile).toHaveProperty('owner');
                expect(tile).toHaveProperty('building');
                expect(tile).toHaveProperty('fogState');
                expect(tile).toHaveProperty('resourcesRemaining');
                expect(tile.resourcesRemaining).toBeGreaterThanOrEqual(100);
                expect(tile.resourcesRemaining).toBeLessThan(200);
            }
        });

        it('contains a variety of terrain types', () => {
            const tiles = generateMap(7);
            const types = new Set(tiles.map(t => t.terrain.id));
            expect(types.size).toBeGreaterThanOrEqual(3);
        });
    });

    // ── getTile ───────────────────────────────────────────────
    describe('getTile', () => {
        it('returns the correct tile for valid coordinates', () => {
            const tiles = generateMap(1);
            const tile = getTile(tiles, 0, 0);
            expect(tile).not.toBeNull();
            expect(tile.q).toBe(0);
            expect(tile.r).toBe(0);
        });

        it('returns null for out-of-bounds coordinates', () => {
            const tiles = generateMap(1);
            expect(getTile(tiles, -1, 0)).toBeNull();
            expect(getTile(tiles, MAP_COLS, 0)).toBeNull();
            expect(getTile(tiles, 0, MAP_ROWS)).toBeNull();
        });
    });

    // ── setTile ───────────────────────────────────────────────
    describe('setTile', () => {
        it('updates tile properties', () => {
            const tiles = generateMap(1);
            setTile(tiles, 0, 0, { owner: 'player' });
            expect(getTile(tiles, 0, 0).owner).toBe('player');
        });

        it('does not crash for out-of-bounds coordinates', () => {
            const tiles = generateMap(1);
            expect(() => setTile(tiles, -1, -1, { owner: 'x' })).not.toThrow();
        });
    });

    // ── findStartPositions ────────────────────────────────────
    describe('findStartPositions', () => {
        it('returns requested number of positions', () => {
            const tiles = generateMap(42);
            const positions = findStartPositions(tiles, 3);
            expect(positions.length).toBe(3);
        });

        it('returns positions that are far apart', () => {
            const tiles = generateMap(42);
            const positions = findStartPositions(tiles, 2);
            if (positions.length >= 2) {
                const dist = Math.abs(positions[0].q - positions[1].q) + Math.abs(positions[0].r - positions[1].r);
                expect(dist).toBeGreaterThan(3);
            }
        });
    });
});
