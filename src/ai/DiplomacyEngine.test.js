import { describe, it, expect, vi } from 'vitest';
import { parsePlayerMessage, evaluateDiplomacy, recordDiplomacyEvent, getRelationshipSummary } from './DiplomacyEngine.js';

describe('DiplomacyEngine', () => {
    // ── parsePlayerMessage ────────────────────────────────────
    describe('parsePlayerMessage', () => {
        it('detects trade intent', () => {
            const result = parsePlayerMessage('I want to trade food for wood');
            expect(result.intent).toBe('OFFER_TRADE');
            expect(result.resources).toContain('food');
            expect(result.resources).toContain('wood');
        });

        it('detects alliance intent', () => {
            const result = parsePlayerMessage('Let us form an alliance together');
            expect(result.intent).toBe('REQUEST_ALLIANCE');
        });

        it('detects threat intent', () => {
            const result = parsePlayerMessage('I will destroy your armies and conquer your lands');
            expect(result.intent).toBe('THREATEN');
        });

        it('detects peace intent', () => {
            const result = parsePlayerMessage('I propose a peace treaty and ceasefire');
            expect(result.intent).toBe('REQUEST_PEACE');
        });

        it('detects greeting intent', () => {
            const result = parsePlayerMessage('Hello, greetings to you');
            expect(result.intent).toBe('GREETING');
        });

        it('detects insult intent', () => {
            const result = parsePlayerMessage('You are a weak fool and a coward');
            expect(result.intent).toBe('INSULT');
        });

        it('detects resource mentions', () => {
            const result = parsePlayerMessage('I need gold and stone');
            expect(result.resources).toContain('gold');
            expect(result.resources).toContain('stone');
        });

        it('falls back to GENERAL for unknown messages', () => {
            const result = parsePlayerMessage('The weather is nice today');
            expect(result.intent).toBe('GENERAL');
        });

        it('returns the raw message', () => {
            const msg = 'Test message 123';
            expect(parsePlayerMessage(msg).raw).toBe(msg);
        });

        it('is case-insensitive', () => {
            const result = parsePlayerMessage('I WANT TO TRADE FOOD');
            expect(result.intent).toBe('OFFER_TRADE');
        });
    });

    // ── evaluateDiplomacy ─────────────────────────────────────
    describe('evaluateDiplomacy', () => {
        const gameState = {
            diplomacyMemory: {},
            relationships: {},
            playerMilitaryStrength: 50,
            aiMilitaryStrength: 50,
        };

        it('returns a response object with response and action', () => {
            const parsed = parsePlayerMessage('Hello');
            const result = evaluateDiplomacy('seraphina', parsed, gameState);
            expect(result).toHaveProperty('response');
            expect(typeof result.response).toBe('string');
        });

        it('returns "..." for unknown leader', () => {
            const parsed = parsePlayerMessage('Hello');
            const result = evaluateDiplomacy('unknown_leader_xyz', parsed, gameState);
            expect(result.response).toBe('...');
        });

        it('compliment boosts relationship', () => {
            const parsed = parsePlayerMessage('I greatly respect and admire your strength');
            const result = evaluateDiplomacy('seraphina', parsed, gameState);
            expect(result.action?.type).toBe('RELATIONSHIP_BOOST');
        });

        it('insult drops relationship', () => {
            const parsed = parsePlayerMessage('You are weak and pathetic');
            const result = evaluateDiplomacy('seraphina', parsed, gameState);
            expect(result.action?.type).toBe('RELATIONSHIP_DROP');
        });
    });

    // ── recordDiplomacyEvent ──────────────────────────────────
    describe('recordDiplomacyEvent', () => {
        it('adds event to memory for a leader', () => {
            const memory = {};
            recordDiplomacyEvent(memory, 'kael', { type: 'trade' });
            expect(memory.kael).toHaveLength(1);
            expect(memory.kael[0].type).toBe('trade');
        });

        it('adds timestamp to events', () => {
            const memory = {};
            recordDiplomacyEvent(memory, 'kael', { type: 'trade' });
            expect(memory.kael[0]).toHaveProperty('timestamp');
        });

        it('trims events to last 20', () => {
            const memory = {};
            for (let i = 0; i < 25; i++) {
                recordDiplomacyEvent(memory, 'kael', { type: 'trade', index: i });
            }
            expect(memory.kael).toHaveLength(20);
        });

        it('preserves existing events for other leaders', () => {
            const memory = {};
            recordDiplomacyEvent(memory, 'kael', { type: 'trade' });
            recordDiplomacyEvent(memory, 'seraphina', { type: 'peace' });
            expect(memory.kael).toHaveLength(1);
            expect(memory.seraphina).toHaveLength(1);
        });
    });

    // ── getRelationshipSummary ────────────────────────────────
    describe('getRelationshipSummary', () => {
        it('returns 0 for no events', () => {
            expect(getRelationshipSummary({}, 'kael')).toBe(0);
        });

        it('returns negative for betrayal', () => {
            const memory = { kael: [{ type: 'betrayal' }] };
            expect(getRelationshipSummary(memory, 'kael')).toBeLessThan(0);
        });

        it('returns positive for trade and peace events', () => {
            const memory = { kael: [{ type: 'trade' }, { type: 'peace' }, { type: 'gift' }] };
            expect(getRelationshipSummary(memory, 'kael')).toBeGreaterThan(0);
        });

        it('clamps between -1 and 1', () => {
            const memory = { kael: Array.from({ length: 20 }, () => ({ type: 'war' })) };
            expect(getRelationshipSummary(memory, 'kael')).toBe(-1);
        });
    });
});
