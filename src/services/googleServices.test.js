import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveGameLocally, loadGameLocally, getLocalLeaderboard, addToLocalLeaderboard, GameEvents } from '../services/googleServices.js';

// Mock localStorage for tests
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] ?? null),
        setItem: vi.fn((key, value) => { store[key] = String(value); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        _getStore: () => store,
    };
})();

// Override global localStorage
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true, configurable: true });

describe('googleServices — Local Fallback', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    // ── saveGameLocally ───────────────────────────────────────
    describe('saveGameLocally', () => {
        it('saves game state to localStorage', () => {
            const state = { tick: 100, resources: { food: 200 } };
            const result = saveGameLocally(state);
            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('returns false on error', () => {
            localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('quota'); });
            const result = saveGameLocally({ tick: 1 });
            expect(result).toBe(false);
        });
    });

    // ── loadGameLocally ───────────────────────────────────────
    describe('loadGameLocally', () => {
        it('returns null when no save exists', () => {
            const result = loadGameLocally();
            expect(result).toBeNull();
        });

        it('loads saved game state', () => {
            const state = { tick: 100, resources: { food: 200 } };
            saveGameLocally(state);
            const loaded = loadGameLocally();
            expect(loaded).toBeDefined();
            expect(loaded.tick).toBe(100);
        });

        it('returns null for corrupt data', () => {
            localStorageMock.getItem.mockReturnValueOnce('not-valid-json{{{');
            const result = loadGameLocally();
            expect(result).toBeNull();
        });
    });

    // ── getLocalLeaderboard ───────────────────────────────────
    describe('getLocalLeaderboard', () => {
        it('returns empty array when no data', () => {
            const result = getLocalLeaderboard();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('returns parsed leaderboard array', () => {
            const entry = { playerName: 'Test', score: 100, era: 'Bronze', difficulty: 'medium', victory: true };
            addToLocalLeaderboard(entry);
            const result = getLocalLeaderboard();
            expect(result.length).toBe(1);
            expect(result[0].playerName).toBe('Test');
        });
    });

    // ── addToLocalLeaderboard ─────────────────────────────────
    describe('addToLocalLeaderboard', () => {
        it('adds an entry to the leaderboard', () => {
            const entry = { playerName: 'Hero', score: 500 };
            const result = addToLocalLeaderboard(entry);
            expect(result.length).toBe(1);
        });

        it('sorts by score descending', () => {
            addToLocalLeaderboard({ playerName: 'Low', score: 100 });
            addToLocalLeaderboard({ playerName: 'High', score: 999 });
            const board = getLocalLeaderboard();
            expect(board[0].score).toBeGreaterThanOrEqual(board[1].score);
        });

        it('limits to 20 entries', () => {
            for (let i = 0; i < 25; i++) {
                addToLocalLeaderboard({ playerName: `P${i}`, score: i * 10 });
            }
            const board = getLocalLeaderboard();
            expect(board.length).toBeLessThanOrEqual(20);
        });
    });

    // ── GameEvents ────────────────────────────────────────────
    describe('GameEvents', () => {
        it('has all expected event constants', () => {
            expect(GameEvents.GAME_START).toBe('game_start');
            expect(GameEvents.GAME_OVER).toBe('game_over');
            expect(GameEvents.ERA_ADVANCE).toBe('era_advance');
            expect(GameEvents.BUILDING_PLACED).toBe('building_placed');
        });

        it('is frozen (immutable)', () => {
            expect(Object.isFrozen(GameEvents)).toBe(true);
        });
    });
});
