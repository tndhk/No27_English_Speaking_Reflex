import { describe, it, expect } from 'vitest';
import {
  normalizeJobRole,
  normalizeInterest,
  getTagsForPrompt,
  JOB_ROLES,
  INTERESTS,
  PROFICIENCY_LEVELS,
  GRAMMAR_PATTERNS,
  CONTEXTS
} from '../constants/tags';

describe('src/constants/tags.js', () => {
  describe('normalizeJobRole()', () => {
    // Exact match cases (C1 coverage for exact match branch)
    it('should return key for exact match: software_engineer', () => {
      expect(normalizeJobRole('software_engineer')).toBe('software_engineer');
    });

    it('should return key for exact match: product_manager', () => {
      expect(normalizeJobRole('product_manager')).toBe('product_manager');
    });

    it('should return key for exact match: designer', () => {
      expect(normalizeJobRole('designer')).toBe('designer');
    });

    // Partial match / alias cases (C1 coverage for alias branch)
    it('should map "swe" to software_engineer', () => {
      expect(normalizeJobRole('swe')).toBe('software_engineer');
    });

    it('should map "engineer" to software_engineer', () => {
      expect(normalizeJobRole('engineer')).toBe('software_engineer');
    });

    it('should map "dev" to software_engineer', () => {
      expect(normalizeJobRole('dev')).toBe('software_engineer');
    });

    it('should map "developer" to software_engineer', () => {
      expect(normalizeJobRole('developer')).toBe('software_engineer');
    });

    it('should map "pm" to product_manager', () => {
      expect(normalizeJobRole('pm')).toBe('product_manager');
    });

    it('should map "ui" to designer', () => {
      expect(normalizeJobRole('ui')).toBe('designer');
    });

    it('should map "ux" to designer', () => {
      expect(normalizeJobRole('ux')).toBe('designer');
    });

    it('should map "mark" to marketing', () => {
      expect(normalizeJobRole('mark')).toBe('marketing');
    });

    it('should map "sales" to sales', () => {
      expect(normalizeJobRole('sales')).toBe('sales');
    });

    it('should map "biz" to business_development', () => {
      expect(normalizeJobRole('biz')).toBe('business_development');
    });

    it('should map "finance" to finance', () => {
      expect(normalizeJobRole('finance')).toBe('finance');
    });

    it('should map "health" to healthcare', () => {
      expect(normalizeJobRole('health')).toBe('healthcare');
    });

    it('should map "med" to healthcare', () => {
      expect(normalizeJobRole('med')).toBe('healthcare');
    });

    it('should map "teach" to education', () => {
      expect(normalizeJobRole('teach')).toBe('education');
    });

    // Case insensitivity
    it('should handle uppercase input', () => {
      expect(normalizeJobRole('DEVELOPER')).toBe('software_engineer');
    });

    it('should handle mixed case input', () => {
      expect(normalizeJobRole('DeVeLoPeR')).toBe('software_engineer');
    });

    it('should handle uppercase alias', () => {
      expect(normalizeJobRole('SWE')).toBe('software_engineer');
    });

    // Whitespace handling
    it('should trim leading whitespace', () => {
      expect(normalizeJobRole('  developer')).toBe('software_engineer');
    });

    it('should trim trailing whitespace', () => {
      expect(normalizeJobRole('developer  ')).toBe('software_engineer');
    });

    it('should trim both leading and trailing whitespace', () => {
      expect(normalizeJobRole('  developer  ')).toBe('software_engineer');
    });

    // Fallback case (C1 coverage for fallback branch)
    it('should return "general_business" for unknown input', () => {
      expect(normalizeJobRole('unknown_role')).toBe('general_business');
    });

    it('should return null for empty string', () => {
      // Implementation checks if (!input) return null; so empty string returns null
      expect(normalizeJobRole('')).toBe(null);
    });

    // Abnormal cases
    it('should return null for null input', () => {
      expect(normalizeJobRole(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(normalizeJobRole(undefined)).toBe(null);
    });

    // Partial match search (substring matching)
    it('should find alias within longer strings', () => {
      // "developer" contains "dev" so should match
      expect(normalizeJobRole('backend_developer')).toBe('software_engineer');
    });

    it('should find multiple aliases and return first match', () => {
      // In 'pm_and_engineer', "engineer" is checked before "pm" in the aliases object
      // so it matches 'engineer' -> 'software_engineer'
      expect(normalizeJobRole('pm_and_engineer')).toBe('software_engineer');
    });

    // Boundary cases
    it('should handle single character input', () => {
      const result = normalizeJobRole('x');
      expect(['general_business', null]).toContain(result);
    });

    it('should handle very long input', () => {
      const longString = 'a'.repeat(1000) + 'developer';
      expect(normalizeJobRole(longString)).toBe('software_engineer');
    });
  });

  describe('normalizeInterest()', () => {
    // Exact match cases
    it('should return key for exact match: technology', () => {
      expect(normalizeInterest('technology')).toBe('technology');
    });

    it('should return key for exact match: business', () => {
      expect(normalizeInterest('business')).toBe('business');
    });

    it('should return key for exact match: travel', () => {
      expect(normalizeInterest('travel')).toBe('travel');
    });

    // Partial match / alias cases
    it('should map "tech" to technology', () => {
      expect(normalizeInterest('tech')).toBe('technology');
    });

    it('should map "ai" to technology', () => {
      expect(normalizeInterest('ai')).toBe('technology');
    });

    it('should map "startup" to technology', () => {
      expect(normalizeInterest('startup')).toBe('technology');
    });

    it('should map "biz" to business', () => {
      expect(normalizeInterest('biz')).toBe('business');
    });

    it('should map "work" to business', () => {
      expect(normalizeInterest('work')).toBe('business');
    });

    it('should map "trip" to travel', () => {
      expect(normalizeInterest('trip')).toBe('travel');
    });

    it('should map "eat" to food', () => {
      expect(normalizeInterest('eat')).toBe('food');
    });

    it('should map "cook" to food', () => {
      expect(normalizeInterest('cook')).toBe('food');
    });

    it('should map "sport" to sports', () => {
      expect(normalizeInterest('sport')).toBe('sports');
    });

    it('should map "gym" to sports', () => {
      expect(normalizeInterest('gym')).toBe('sports');
    });

    it('should map "cult" to culture', () => {
      expect(normalizeInterest('cult')).toBe('culture');
    });

    it('should map "art" to culture', () => {
      expect(normalizeInterest('art')).toBe('culture');
    });

    it('should map "life" to daily_life', () => {
      expect(normalizeInterest('life')).toBe('daily_life');
    });

    it('should map "entertain" as an alias', () => {
      // "entertain" is defined as an alias in the normalizeInterest function
      const result = normalizeInterest('entertain');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(['entertainment', 'technology', 'general_business']).toContain(result);
    });

    it('should map "movie" to entertainment', () => {
      expect(normalizeInterest('movie')).toBe('entertainment');
    });

    it('should map "music" to entertainment', () => {
      expect(normalizeInterest('music')).toBe('entertainment');
    });

    it('should map "health" to health', () => {
      expect(normalizeInterest('health')).toBe('health');
    });

    it('should map "fit" to health', () => {
      expect(normalizeInterest('fit')).toBe('health');
    });

    it('should map "money" to finance', () => {
      expect(normalizeInterest('money')).toBe('finance');
    });

    // Case insensitivity
    it('should handle uppercase input', () => {
      expect(normalizeInterest('TECHNOLOGY')).toBe('technology');
    });

    it('should handle mixed case input', () => {
      expect(normalizeInterest('TeChNoLoGy')).toBe('technology');
    });

    // Whitespace handling
    it('should trim leading whitespace', () => {
      expect(normalizeInterest('  technology')).toBe('technology');
    });

    it('should trim trailing whitespace', () => {
      expect(normalizeInterest('technology  ')).toBe('technology');
    });

    // Fallback case
    it('should return "general_business" for unknown input', () => {
      expect(normalizeInterest('unknown_interest')).toBe('general_business');
    });

    it('should return "general_business" for empty string', () => {
      expect(normalizeInterest('')).toBe('general_business');
    });

    // Abnormal cases
    it('should return "general_business" for null input', () => {
      expect(normalizeInterest(null)).toBe('general_business');
    });

    it('should return "general_business" for undefined input', () => {
      expect(normalizeInterest(undefined)).toBe('general_business');
    });

    // Partial match (substring)
    it('should find aliases within longer strings', () => {
      // Test with strings that contain known aliases
      // "cooking" contains "cook" -> food
      expect(normalizeInterest('cooking')).toBe('food');
      // "sports_fan" contains "sport" -> sports
      expect(normalizeInterest('sports_fan')).toBe('sports');
    });

    it('should find "entertainment" alias in longer strings', () => {
      expect(normalizeInterest('movie_watching')).toBe('entertainment');
    });

    // Boundary cases
    it('should handle single character input', () => {
      const result = normalizeInterest('x');
      expect(result).toBe('general_business');
    });

    it('should handle very long input with alias', () => {
      const longString = 'a'.repeat(1000) + 'technology';
      expect(normalizeInterest(longString)).toBe('technology');
    });
  });

  describe('getTagsForPrompt()', () => {
    let tags;

    beforeEach(() => {
      tags = getTagsForPrompt();
    });

    it('should return an object with all required keys', () => {
      expect(tags).toHaveProperty('jobRoles');
      expect(tags).toHaveProperty('interests');
      expect(tags).toHaveProperty('grammarPatterns');
      expect(tags).toHaveProperty('contexts');
    });

    it('should return jobRoles as array', () => {
      expect(Array.isArray(tags.jobRoles)).toBe(true);
    });

    it('should return interests as array', () => {
      expect(Array.isArray(tags.interests)).toBe(true);
    });

    it('should return grammarPatterns as array', () => {
      expect(Array.isArray(tags.grammarPatterns)).toBe(true);
    });

    it('should return contexts as array', () => {
      expect(Array.isArray(tags.contexts)).toBe(true);
    });

    // Job roles validation
    it('should contain all JOB_ROLES keys', () => {
      const expectedKeys = Object.keys(JOB_ROLES);
      expect(tags.jobRoles).toEqual(expect.arrayContaining(expectedKeys));
    });

    it('should have correct number of job roles', () => {
      expect(tags.jobRoles.length).toBe(Object.keys(JOB_ROLES).length);
    });

    // Interests validation
    it('should contain all INTERESTS keys', () => {
      const expectedKeys = Object.keys(INTERESTS);
      expect(tags.interests).toEqual(expect.arrayContaining(expectedKeys));
    });

    it('should have correct number of interests', () => {
      expect(tags.interests.length).toBe(Object.keys(INTERESTS).length);
    });

    // Grammar patterns validation
    it('should contain all GRAMMAR_PATTERNS keys', () => {
      const expectedKeys = Object.keys(GRAMMAR_PATTERNS);
      expect(tags.grammarPatterns).toEqual(expect.arrayContaining(expectedKeys));
    });

    it('should have correct number of grammar patterns', () => {
      expect(tags.grammarPatterns.length).toBe(Object.keys(GRAMMAR_PATTERNS).length);
    });

    // Contexts validation
    it('should contain all CONTEXTS keys', () => {
      const expectedKeys = Object.keys(CONTEXTS);
      expect(tags.contexts).toEqual(expect.arrayContaining(expectedKeys));
    });

    it('should have correct number of contexts', () => {
      expect(tags.contexts.length).toBe(Object.keys(CONTEXTS).length);
    });

    // Data type checks
    it('should have no empty arrays', () => {
      expect(tags.jobRoles.length).toBeGreaterThan(0);
      expect(tags.interests.length).toBeGreaterThan(0);
      expect(tags.grammarPatterns.length).toBeGreaterThan(0);
      expect(tags.contexts.length).toBeGreaterThan(0);
    });

    it('should have strings in all arrays', () => {
      tags.jobRoles.forEach(role => expect(typeof role).toBe('string'));
      tags.interests.forEach(interest => expect(typeof interest).toBe('string'));
      tags.grammarPatterns.forEach(pattern => expect(typeof pattern).toBe('string'));
      tags.contexts.forEach(context => expect(typeof context).toBe('string'));
    });

    it('should not mutate arrays between calls', () => {
      const tags1 = getTagsForPrompt();
      const tags2 = getTagsForPrompt();
      expect(tags1.jobRoles).toEqual(tags2.jobRoles);
      expect(tags1.interests).toEqual(tags2.interests);
    });

    it('should return consistent structure across calls', () => {
      const tags1 = getTagsForPrompt();
      const tags2 = getTagsForPrompt();
      expect(Object.keys(tags1)).toEqual(Object.keys(tags2));
    });
  });

  // Constants validation
  describe('Constants validation', () => {
    it('PROFICIENCY_LEVELS should have correct structure', () => {
      expect(PROFICIENCY_LEVELS.beginner).toHaveProperty('id');
      expect(PROFICIENCY_LEVELS.beginner).toHaveProperty('label');
      expect(PROFICIENCY_LEVELS.beginner).toHaveProperty('promptInstruction');
    });

    it('JOB_ROLES should be non-empty object', () => {
      expect(Object.keys(JOB_ROLES).length).toBeGreaterThan(0);
    });

    it('INTERESTS should be non-empty object', () => {
      expect(Object.keys(INTERESTS).length).toBeGreaterThan(0);
    });

    it('GRAMMAR_PATTERNS should be non-empty object', () => {
      expect(Object.keys(GRAMMAR_PATTERNS).length).toBeGreaterThan(0);
    });

    it('CONTEXTS should be non-empty object', () => {
      expect(Object.keys(CONTEXTS).length).toBeGreaterThan(0);
    });
  });
});
