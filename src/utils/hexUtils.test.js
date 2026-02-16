import { describe, it, expect } from 'vitest';
import { hexToPixel, pixelToHex, hexRound, hexDistance, hexNeighbors, hexCorners, isValidHex } from './hexUtils.js';

describe('hexUtils', () => {
    // ── hexToPixel ────────────────────────────────────────────
    describe('hexToPixel', () => {
        it('returns origin for (0,0)', () => {
            const { x, y } = hexToPixel(0, 0, 30);
            expect(x).toBe(0);
            expect(y).toBe(0);
        });

        it('returns correct pixel for non-zero coords', () => {
            const { x, y } = hexToPixel(1, 0, 30);
            expect(x).toBe(45); // 30 * (3/2 * 1)
            expect(y).toBeCloseTo(30 * Math.sqrt(3) / 2, 5);
        });
    });

    // ── pixelToHex / hexRound roundtrip ───────────────────────
    describe('pixelToHex + hexRound', () => {
        it('roundtrips from hex → pixel → hex', () => {
            const size = 30;
            const testCases = [
                { q: 0, r: 0 },
                { q: 3, r: 2 },
                { q: 5, r: 7 },
                { q: 10, r: 0 },
            ];
            for (const { q, r } of testCases) {
                const { x, y } = hexToPixel(q, r, size);
                const result = pixelToHex(x, y, size);
                // +0 normalizes -0 to 0 for strict equality
                expect(result.q + 0).toBe(q);
                expect(result.r + 0).toBe(r);
            }
        });
    });

    // ── hexRound ──────────────────────────────────────────────
    describe('hexRound', () => {
        it('returns exact integers unchanged', () => {
            expect(hexRound(3, 4)).toEqual({ q: 3, r: 4 });
        });

        it('rounds fractional coordinates correctly', () => {
            const result = hexRound(2.3, 1.2);
            expect(Number.isInteger(result.q)).toBe(true);
            expect(Number.isInteger(result.r)).toBe(true);
        });
    });

    // ── hexDistance ────────────────────────────────────────────
    describe('hexDistance', () => {
        it('returns 0 for same position', () => {
            expect(hexDistance({ q: 3, r: 3 }, { q: 3, r: 3 })).toBe(0);
        });

        it('returns 1 for adjacent hexes', () => {
            expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
        });

        it('returns correct distance for distant hexes', () => {
            const dist = hexDistance({ q: 0, r: 0 }, { q: 5, r: 5 });
            expect(dist).toBeGreaterThan(0);
        });
    });

    // ── hexNeighbors ──────────────────────────────────────────
    describe('hexNeighbors', () => {
        it('returns exactly 6 neighbors', () => {
            expect(hexNeighbors(3, 3)).toHaveLength(6);
        });

        it('all neighbors are distance 1 away', () => {
            const center = { q: 3, r: 3 };
            const neighbors = hexNeighbors(center.q, center.r);
            for (const n of neighbors) {
                expect(hexDistance(center, n)).toBe(1);
            }
        });
    });

    // ── hexCorners ────────────────────────────────────────────
    describe('hexCorners', () => {
        it('returns exactly 6 corners', () => {
            expect(hexCorners(100, 100, 30)).toHaveLength(6);
        });

        it('corners are equidistant from center', () => {
            const corners = hexCorners(0, 0, 30);
            for (const c of corners) {
                const dist = Math.sqrt(c.x ** 2 + c.y ** 2);
                expect(dist).toBeCloseTo(30, 3);
            }
        });
    });

    // ── isValidHex ────────────────────────────────────────────
    describe('isValidHex', () => {
        it('returns true for valid coordinates', () => {
            expect(isValidHex(0, 0, 30, 20)).toBe(true);
            expect(isValidHex(10, 10, 30, 20)).toBe(true);
        });

        it('returns false for out-of-bounds', () => {
            expect(isValidHex(-1, 0, 30, 20)).toBe(false);
            expect(isValidHex(30, 0, 30, 20)).toBe(false);
            expect(isValidHex(0, 20, 30, 20)).toBe(false);
        });
    });
});
