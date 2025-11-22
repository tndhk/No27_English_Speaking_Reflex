/**
 * Adds specified number of days to a date
 * @param {Date} date - The starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New Date object with days added
 *
 * @example
 * const tomorrow = addDays(new Date(), 1);
 * const nextWeek = addDays(new Date(), 7);
 */
export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * Calculates the next review date based on user rating
 * Implements spaced repetition intervals:
 * - hard (1): Review in 1 day - for difficult cards
 * - soso (3): Review in 3 days - for moderately known cards
 * - easy (7): Review in 7 days - for well-known cards
 *
 * @param {string} rating - User's difficulty rating: 'hard', 'soso', or 'easy'
 * @returns {Date} Recommended next review date
 *
 * @example
 * const nextReview = getNextReviewDate('hard');
 * const userDrill = { nextReviewAt: Timestamp.fromDate(nextReview) };
 */
export const getNextReviewDate = (rating) => {
    const now = new Date();
    if (rating === 'hard') return addDays(now, 1);
    if (rating === 'soso') return addDays(now, 3);
    if (rating === 'easy') return addDays(now, 7);
    return now;
};

/**
 * Generates a mock drill for demonstration or fallback purposes
 * Creates placeholder content based on user profile
 *
 * @param {Object} profile - User profile containing:
 *   - job: {string} User's profession
 *   - interests: {string} User's interests
 * @param {number} idx - Index/counter for uniqueness
 * @returns {Object} Mock drill object with jp, en, context, grammar fields
 *
 * @example
 * const mockDrill = generateMockDrill(
 *   { job: 'Designer', interests: 'Art' },
 *   0
 * );
 * // { jp: 'これはDesigner向けのデモです(0)。', en: '...' }
 */
export const generateMockDrill = (profile, idx) => ({
    jp: `これは${profile.job}向けのデモです(${idx})。`,
    en: `This is a demo sentence for a ${profile.job} (${idx}).`,
    context: 'Demo',
    grammar: 'SVO Pattern'
});
