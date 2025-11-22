import { useState } from 'react';
import { PROFICIENCY_LEVELS, normalizeJobRole, normalizeInterest } from '../constants/tags';
import { generateMockDrill } from '../utils';
import { sanitizeForPrompt } from '../utils/sanitization';
import { saveContentToPool } from '../utils/contentPool';

export function useGemini() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateAndSaveDrills = async (count, profile) => {
        setLoading(true);
        setError(null);
        let newDrills = [];

        try {
            // Sanitize user inputs to prevent prompt injection
            const sanitizedJob = sanitizeForPrompt(profile.job);
            const sanitizedInterests = sanitizeForPrompt(profile.interests);

            // Validate sanitized inputs
            if (!sanitizedJob || sanitizedJob.length < 2 || !sanitizedInterests || sanitizedInterests.length < 2) {
                throw new Error("Please provide valid job title and interests (minimum 2 characters each)");
            }

            if (import.meta.env.DEV) {
                console.log("Requesting drills from backend API...");
            }

            // Call backend API endpoint instead of Gemini directly
            // This protects the API key and adds server-side rate limiting/validation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const response = await fetch('/api/generate-drills', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        count,
                        level: profile.levelId,
                        profile: {
                            job: sanitizedJob,
                            interests: sanitizedInterests
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `API Error: ${response.status}`);
                }

                const data = await response.json();

                if (!data.success || !Array.isArray(data.drills)) {
                    throw new Error('Invalid response format from API');
                }

                // Save all drills to Supabase content pool and create local drill records
                newDrills = await Promise.all(data.drills.map(async (drill) => {
                    const contentData = {
                        jp: drill.jp,
                        en: drill.en,
                        level: drill.level,
                        job_roles: drill.job_roles || [],
                        interests: drill.interests || [],
                        grammar_patterns: drill.grammar_patterns || [],
                        contexts: drill.contexts || [],
                        created_at: drill.created_at,
                        usage_count: drill.usage_count || 0,
                        downvotes: drill.downvotes || 0,
                        generated_by: drill.generated_by || 'gemini'
                    };

                    // Save to contentPool using reusable utility
                    try {
                        await saveContentToPool(drill.id, contentData);
                    } catch (e) {
                        console.error("Error saving generated content:", drill.id, e);
                    }

                    return {
                        ...contentData,
                        id: drill.id,
                        type: 'new'
                    };
                }));
            } catch (fetchErr) {
                clearTimeout(timeoutId);

                if (fetchErr.name === 'AbortError') {
                    throw new Error("Request timed out. Please try again.");
                }

                throw fetchErr;
            }
        } catch (e) {
            if (import.meta.env.DEV) {
                console.log("Debug: Error generating drills:", e.message);
            }

            setError(e.message);

            // Fallback to mock data on error
            newDrills = await Promise.all(Array.from({ length: count }).map(async (_, i) => {
                const contentId = `mock_${Date.now()}_${i}`;
                const mockData = generateMockDrill(profile, i);
                const contentData = {
                    jp: mockData.jp,
                    en: mockData.en,
                    context: mockData.context,
                    grammar: mockData.grammar,
                    level: profile.levelId,
                    job_roles: [normalizeJobRole(profile.job)],
                    interests: [normalizeInterest(profile.interests)],
                    grammar_patterns: [mockData.grammar],
                    contexts: [mockData.context],
                    created_at: new Date().toISOString(),
                    usage_count: 0,
                    downvotes: 0,
                    generated_by: 'mock'
                };

                try {
                    await saveContentToPool(contentId, contentData);
                } catch (e) {
                    console.error("Error saving fallback mock content:", contentId, e);
                }

                return { ...contentData, id: contentId, type: 'new' };
            }));
        } finally {
            setLoading(false);
        }

        return newDrills;
    };

    return { generateAndSaveDrills, loading, error };
}
