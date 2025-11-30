import { describe, it, expect, beforeEach } from 'vitest';
import { addDays, getNextReviewDate, generateMockDrill } from '../utils';

describe('src/utils.js', () => {
  describe('addDays()', () => {
    let baseDate;

    beforeEach(() => {
      baseDate = new Date('2025-01-15T12:00:00');
    });

    // Normal cases
    it('should add positive number of days correctly', () => {
      const result = addDays(baseDate, 5);
      const expected = new Date('2025-01-20T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should add 0 days (boundary value)', () => {
      const result = addDays(baseDate, 0);
      expect(result.getTime()).toBe(baseDate.getTime());
    });

    it('should add 1 day (lower boundary)', () => {
      const result = addDays(baseDate, 1);
      const expected = new Date('2025-01-16T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should add 7 days (spaced repetition boundary)', () => {
      const result = addDays(baseDate, 7);
      const expected = new Date('2025-01-22T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle negative days (subtract)', () => {
      const result = addDays(baseDate, -5);
      const expected = new Date('2025-01-10T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle month boundary crossing forward', () => {
      const dateNearEnd = new Date('2025-01-28T12:00:00');
      const result = addDays(dateNearEnd, 5);
      const expected = new Date('2025-02-02T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle month boundary crossing backward', () => {
      const dateNearStart = new Date('2025-02-02T12:00:00');
      const result = addDays(dateNearStart, -5);
      const expected = new Date('2025-01-28T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle year boundary crossing', () => {
      const dateNearYearEnd = new Date('2025-12-28T12:00:00');
      const result = addDays(dateNearYearEnd, 5);
      const expected = new Date('2026-01-02T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should not mutate the input date', () => {
      const originalTime = baseDate.getTime();
      addDays(baseDate, 5);
      expect(baseDate.getTime()).toBe(originalTime);
    });

    it('should handle large day values', () => {
      const result = addDays(baseDate, 365);
      const expected = new Date('2026-01-15T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle leap year dates', () => {
      const leapDate = new Date('2024-02-28T12:00:00');
      const result = addDays(leapDate, 1);
      const expected = new Date('2024-02-29T12:00:00');
      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('getNextReviewDate()', () => {
    let beforeTest;

    beforeEach(() => {
      beforeTest = new Date();
    });

    // Test each rating branch (C1 coverage)
    it('should return date 1 day in future for "hard" rating', () => {
      const result = getNextReviewDate('hard');
      const diff = (result.getTime() - beforeTest.getTime()) / (1000 * 60 * 60 * 24);
      // Should be approximately 1 day (allow small time margin)
      expect(diff).toBeGreaterThan(0.99);
      expect(diff).toBeLessThan(1.01);
    });

    it('should return date 3 days in future for "soso" rating', () => {
      const result = getNextReviewDate('soso');
      const diff = (result.getTime() - beforeTest.getTime()) / (1000 * 60 * 60 * 24);
      expect(diff).toBeGreaterThan(2.99);
      expect(diff).toBeLessThan(3.01);
    });

    it('should return date 7 days in future for "easy" rating', () => {
      const result = getNextReviewDate('easy');
      const diff = (result.getTime() - beforeTest.getTime()) / (1000 * 60 * 60 * 24);
      expect(diff).toBeGreaterThan(6.99);
      expect(diff).toBeLessThan(7.01);
    });

    it('should return current date for unknown rating (fallback)', () => {
      const result = getNextReviewDate('unknown');
      const diff = (result.getTime() - beforeTest.getTime()) / 1000;
      expect(diff).toBeLessThan(1); // Should be same day
    });

    it('should return current date for null rating', () => {
      const result = getNextReviewDate(null);
      const diff = (result.getTime() - beforeTest.getTime()) / 1000;
      expect(diff).toBeLessThan(1);
    });

    it('should return current date for undefined rating', () => {
      const result = getNextReviewDate(undefined);
      const diff = (result.getTime() - beforeTest.getTime()) / 1000;
      expect(diff).toBeLessThan(1);
    });

    it('should return current date for empty string rating', () => {
      const result = getNextReviewDate('');
      const diff = (result.getTime() - beforeTest.getTime()) / 1000;
      expect(diff).toBeLessThan(1);
    });

    it('should handle case sensitivity for ratings', () => {
      // Test that ratings are case-sensitive (uppercase should not match)
      const result = getNextReviewDate('HARD');
      const diff = (result.getTime() - beforeTest.getTime()) / 1000;
      expect(diff).toBeLessThan(1); // Should fallback to current date
    });

    it('should return Date objects for all rating types', () => {
      const ratings = ['hard', 'soso', 'easy', 'unknown'];
      ratings.forEach(rating => {
        const result = getNextReviewDate(rating);
        expect(result).toBeInstanceOf(Date);
      });
    });
  });

  describe('generateMockDrill()', () => {
    // Normal cases
    it('should generate drill with correct job field', () => {
      const profile = { job: 'Engineer', interests: 'Technology' };
      const result = generateMockDrill(profile, 0);
      expect(result.jp).toContain('Engineer');
      expect(result.en).toContain('Engineer');
    });

    it('should include index in generated drill text', () => {
      const profile = { job: 'Designer', interests: 'Art' };
      const result = generateMockDrill(profile, 42);
      expect(result.jp).toContain('42');
      expect(result.en).toContain('42');
    });

    it('should have all required fields', () => {
      const profile = { job: 'Manager', interests: 'Business' };
      const result = generateMockDrill(profile, 1);
      expect(result).toHaveProperty('jp');
      expect(result).toHaveProperty('en');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('grammar');
    });

    it('should have correct context and grammar values', () => {
      const profile = { job: 'Developer', interests: 'Code' };
      const result = generateMockDrill(profile, 0);
      expect(result.context).toBe('Demo');
      expect(result.grammar).toBe('SVO Pattern');
    });

    // Boundary value analysis
    it('should handle index = 0 (boundary)', () => {
      const profile = { job: 'Test', interests: 'Value' };
      const result = generateMockDrill(profile, 0);
      expect(result.jp).toContain('(0)');
      expect(result.en).toContain('(0)');
    });

    it('should handle large index values', () => {
      const profile = { job: 'Test', interests: 'Value' };
      const result = generateMockDrill(profile, 999999);
      expect(result.jp).toContain('999999');
      expect(result.en).toContain('999999');
    });

    it('should handle negative index values', () => {
      const profile = { job: 'Test', interests: 'Value' };
      const result = generateMockDrill(profile, -1);
      expect(result.jp).toContain('-1');
      expect(result.en).toContain('-1');
    });

    // Abnormal cases
    it('should handle profile with special characters in job', () => {
      const profile = { job: 'C++ Engineer', interests: 'Tech' };
      const result = generateMockDrill(profile, 0);
      expect(result.jp).toContain('C++ Engineer');
      expect(result.en).toContain('C++ Engineer');
    });

    it('should handle profile with unicode characters', () => {
      const profile = { job: 'エンジニア', interests: '技術' };
      const result = generateMockDrill(profile, 0);
      expect(result.jp).toContain('エンジニア');
    });

    it('should handle empty profile fields', () => {
      const profile = { job: '', interests: '' };
      const result = generateMockDrill(profile, 0);
      expect(result).toHaveProperty('jp');
      expect(result).toHaveProperty('en');
      expect(result.jp).toContain('向けのデモです');
    });

    it('should handle very long job names', () => {
      const longJob = 'A'.repeat(500);
      const profile = { job: longJob, interests: 'Test' };
      const result = generateMockDrill(profile, 0);
      expect(result.jp).toContain(longJob);
    });

    it('should return consistent structure across calls', () => {
      const profile = { job: 'Test', interests: 'Value' };
      const result1 = generateMockDrill(profile, 0);
      const result2 = generateMockDrill(profile, 0);
      expect(result1).toEqual(result2);
    });

    it('should not mutate the profile object', () => {
      const profile = { job: 'Test', interests: 'Value' };
      const originalProfile = JSON.stringify(profile);
      generateMockDrill(profile, 0);
      expect(JSON.stringify(profile)).toBe(originalProfile);
    });
  });
});
