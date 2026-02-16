import { describe, it, expect } from 'vitest';
import { sanitizeInput, generateSecureId, validateResourceValues, isValidCoordinate } from '../utils/security';

describe('security.js', () => {
    describe('sanitizeInput', () => {
        it('removes HTML tags', () => {
            expect(sanitizeInput('<b>bold</b>')).toBe('bold');
        });

        it('removes script tags but keeps inner text', () => {
            // sanitizeInput strips tags, not their content
            const result = sanitizeInput('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('</script>');
        });

        it('trims whitespace', () => {
            expect(sanitizeInput('  hello  ')).toBe('hello');
        });

        it('enforces maxLength', () => {
            const long = 'a'.repeat(600);
            expect(sanitizeInput(long, 500).length).toBe(500);
        });

        it('returns empty string for non-string input', () => {
            expect(sanitizeInput(null)).toBe('');
            expect(sanitizeInput(undefined)).toBe('');
            expect(sanitizeInput(123)).toBe('');
        });

        it('strips dangerous event handlers', () => {
            expect(sanitizeInput('onclick=alert(1)')).not.toContain('onclick=');
        });

        it('strips javascript: protocol', () => {
            expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
        });
    });

    describe('generateSecureId', () => {
        it('returns a string', () => {
            expect(typeof generateSecureId()).toBe('string');
        });

        it('includes prefix when provided', () => {
            const id = generateSecureId('test');
            expect(id.startsWith('test-')).toBe(true);
        });

        it('generates unique IDs', () => {
            const ids = new Set(Array.from({ length: 100 }, () => generateSecureId()));
            expect(ids.size).toBe(100);
        });
    });

    describe('validateResourceValues', () => {
        it('clamps negative values to 0', () => {
            const result = validateResourceValues({ food: -10, wood: 50 });
            expect(result.food).toBe(0);
            expect(result.wood).toBe(50);
        });

        it('handles NaN and Infinity', () => {
            const result = validateResourceValues({ food: NaN, wood: Infinity });
            expect(result.food).toBe(0);
            expect(result.wood).toBe(0);
        });

        it('returns valid resources unchanged', () => {
            const res = { food: 100, wood: 200, stone: 50, gold: 25 };
            expect(validateResourceValues(res)).toEqual(res);
        });

        it('returns defaults for null input', () => {
            const result = validateResourceValues(null);
            expect(result).toEqual({ food: 0, wood: 0, stone: 0, gold: 0 });
        });
    });

    describe('isValidCoordinate', () => {
        it('accepts valid coordinates', () => {
            expect(isValidCoordinate(0, 0, 30, 20)).toBe(true);
            expect(isValidCoordinate(10, 15, 30, 20)).toBe(true);
        });

        it('rejects negative coordinates', () => {
            expect(isValidCoordinate(-1, 5, 30, 20)).toBe(false);
        });

        it('rejects out-of-bounds coordinates', () => {
            expect(isValidCoordinate(30, 0, 30, 20)).toBe(false);
        });

        it('rejects non-integer coordinates', () => {
            expect(isValidCoordinate(1.5, 3, 30, 20)).toBe(false);
        });

        it('rejects NaN coordinates', () => {
            expect(isValidCoordinate(NaN, 0, 30, 20)).toBe(false);
        });
    });
});
