export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const getNextReviewDate = (rating) => {
    const now = new Date();
    if (rating === 'hard') return addDays(now, 1);
    if (rating === 'soso') return addDays(now, 3);
    if (rating === 'easy') return addDays(now, 7);
    return now;
};

export const generateMockDrill = (profile, idx) => ({
    jp: `これは${profile.job}向けのデモです(${idx})。`,
    en: `This is a demo sentence for a ${profile.job} (${idx}).`,
    context: 'Demo',
    grammar: 'SVO Pattern'
});
