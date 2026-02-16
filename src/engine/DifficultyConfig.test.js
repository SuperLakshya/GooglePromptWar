import { describe, it, expect } from 'vitest';
import { getDifficultySettings, getAllDifficulties, DIFFICULTY_SETTINGS } from '../engine/DifficultyConfig';

describe('DifficultyConfig', () => {
    describe('DIFFICULTY_SETTINGS', () => {
        it('has exactly 3 difficulty levels', () => {
            expect(Object.keys(DIFFICULTY_SETTINGS)).toHaveLength(3);
        });

        it('has easy, medium, hard keys', () => {
            expect(DIFFICULTY_SETTINGS).toHaveProperty('easy');
            expect(DIFFICULTY_SETTINGS).toHaveProperty('medium');
            expect(DIFFICULTY_SETTINGS).toHaveProperty('hard');
        });

        it('all difficulties have required fields', () => {
            for (const diff of Object.values(DIFFICULTY_SETTINGS)) {
                expect(diff).toHaveProperty('id');
                expect(diff).toHaveProperty('name');
                expect(diff).toHaveProperty('aiResourceMultiplier');
                expect(diff).toHaveProperty('aiAggressionTimer');
                expect(diff).toHaveProperty('aiMaxMilitary');
                expect(diff).toHaveProperty('aiAttackGroupSize');
                expect(diff).toHaveProperty('playerResourceBonus');
            }
        });
    });

    describe('getDifficultySettings', () => {
        it('returns settings for valid difficulty', () => {
            const easy = getDifficultySettings('easy');
            expect(easy.id).toBe('easy');
        });

        it('defaults to medium for unknown difficulty', () => {
            const result = getDifficultySettings('impossible');
            expect(result.id).toBe('medium');
        });

        it('easy gives player resource bonus', () => {
            const easy = getDifficultySettings('easy');
            expect(easy.playerResourceBonus).toBeGreaterThan(1);
        });

        it('hard has more aggressive AI', () => {
            const easy = getDifficultySettings('easy');
            const hard = getDifficultySettings('hard');
            expect(hard.aiAggressionTimer).toBeLessThan(easy.aiAggressionTimer);
            expect(hard.aiResourceMultiplier).toBeGreaterThan(easy.aiResourceMultiplier);
        });
    });

    describe('getAllDifficulties', () => {
        it('returns an array of all difficulties', () => {
            const all = getAllDifficulties();
            expect(Array.isArray(all)).toBe(true);
            expect(all.length).toBe(3);
        });
    });
});
