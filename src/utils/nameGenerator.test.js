import { describe, it, expect, beforeEach } from 'vitest';
import { generateSettlementName, resetNameGenerator } from './nameGenerator.js';

describe('nameGenerator', () => {
    beforeEach(() => {
        resetNameGenerator();
    });

    it('returns a non-empty string', () => {
        const name = generateSettlementName();
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
    });

    it('produces different names sequentially', () => {
        const a = generateSettlementName();
        const b = generateSettlementName();
        expect(a).not.toBe(b);
    });

    it('resets to the first name after resetNameGenerator', () => {
        const first = generateSettlementName();
        resetNameGenerator();
        const afterReset = generateSettlementName();
        expect(afterReset).toBe(first);
    });

    it('wraps around without crashing', () => {
        // Generate more names than prefixes × suffixes
        const names = [];
        for (let i = 0; i < 400; i++) {
            names.push(generateSettlementName());
        }
        expect(names.length).toBe(400);
        // All should be non-empty strings
        for (const n of names) {
            expect(n.length).toBeGreaterThan(0);
        }
    });
});
