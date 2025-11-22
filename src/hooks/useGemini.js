import { useState } from 'react';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { PROFICIENCY_LEVELS, normalizeJobRole, normalizeInterest, getTagsForPrompt } from '../constants/tags';
import { generateMockDrill } from '../utils';
import { sanitizeForPrompt } from '../utils/sanitization';

export function useGemini() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    const generateAndSaveDrills = async (count, profile) => {
        setLoading(true);
        setError(null);
        let newDrills = [];

        try {
            if (apiKey) {
                if (import.meta.env.DEV) {
                    console.log("Debug: Attempting generation with Gemini...");
                }
                const selectedLevel = PROFICIENCY_LEVELS[profile.levelId];
                const tagsInfo = getTagsForPrompt();

                // Sanitize user inputs to prevent prompt injection
                const sanitizedJob = sanitizeForPrompt(profile.job);
                const sanitizedInterests = sanitizeForPrompt(profile.interests);

                // Validate sanitized inputs
                if (!sanitizedJob || !sanitizedInterests) {
                    throw new Error("Invalid job or interests input");
                }

                const systemPrompt = `Generate ${count} pairs of Japanese/English sentences for a ${sanitizedJob} interested in ${sanitizedInterests}.
Level: ${selectedLevel.label}.
Constraints: ${selectedLevel.promptInstruction}

IMPORTANT: For each pair, also provide these tags:
- grammarPatterns: array of 1-2 from [${tagsInfo.grammarPatterns.join(', ')}]
- contexts: array of 1-2 from [${tagsInfo.contexts.join(', ')}]

Rules: JSON Array of objects with keys "en" (English), "jp" (Japanese), "grammarPatterns" (array), "contexts" (array).`;

                if (import.meta.env.DEV) {
                    console.log("Debug: Starting fetch to Gemini...");
                }
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: "Generate." }] }],
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            generationConfig: { responseMimeType: "application/json" }
                        })
                    }
                );

                if (import.meta.env.DEV) {
                    console.log("Debug: Fetch completed. Status:", response.status);
                }

                if (!response.ok) {
                    const text = await response.text();
                    if (import.meta.env.DEV) {
                        console.log("Debug: API Error Response Body:", text);
                    }
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                if (import.meta.env.DEV) {
                    console.log("Debug: API Data received");
                }

                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error("Invalid API response format");
                }

                let rawText = data.candidates[0].content.parts[0].text;
                if (import.meta.env.DEV) {
                    console.log("Debug: Raw Gemini Text:", rawText);
                }

                // Clean up markdown code blocks if present
                rawText = rawText.replace(/```json\n?|```/g, '').trim();

                const generated = JSON.parse(rawText);
                newDrills = await Promise.all(generated.map(async (item) => {
                    const contentId = `gen_${Date.now()}_${Math.random()}`;
                    const contentData = {
                        jp: item.jp || item.japanese,
                        en: item.en || item.english,
                        level: profile.levelId,
                        jobRoles: [normalizeJobRole(profile.job)],
                        interests: [normalizeInterest(profile.interests)],
                        grammarPatterns: item.grammarPatterns || [],
                        contexts: item.contexts || [],
                        created_at: Timestamp.now(),
                        usageCount: 1,
                        downvotes: 0,
                        generatedBy: 'gemini'
                    };

                    // Save to contentPool
                    try {
                        const contentRef = doc(db, 'artifacts', appId, 'contentPool', contentId);
                        await setDoc(contentRef, contentData);
                    } catch (e) {
                        console.error("Error saving to contentPool:", e);
                    }

                    return {
                        ...contentData,
                        id: contentId,
                        type: 'new'
                    };
                }));
            } else {
                // No API key, fallback to mock
                newDrills = await Promise.all(Array.from({ length: count }).map(async (_, i) => {
                    const contentId = `mock_${Date.now()}_${i}`;
                    const mockData = generateMockDrill(profile, i);
                    const contentData = {
                        ...mockData,
                        level: profile.levelId,
                        jobRoles: [normalizeJobRole(profile.job)],
                        interests: [normalizeInterest(profile.interests)],
                        grammarPatterns: [],
                        contexts: [],
                        created_at: Timestamp.now(),
                        usageCount: 1,
                        downvotes: 0,
                        generatedBy: 'mock'
                    };

                    // Save mock to contentPool too
                    try {
                        const contentRef = doc(db, 'artifacts', appId, 'contentPool', contentId);
                        await setDoc(contentRef, contentData);
                    } catch (e) {
                        console.error("Error saving mock to contentPool:", e);
                    }

                    return { ...contentData, id: contentId, type: 'new' };
                }));
            }
        } catch (e) {
            if (import.meta.env.DEV) {
                console.log("Debug: Gemini API ERROR CAUGHT:", e);
            }
            setError(e.message);
            // Fallback to mock data on error
            newDrills = await Promise.all(Array.from({ length: count }).map(async (_, i) => {
                const contentId = `mock_${Date.now()}_${i}`;
                const mockData = generateMockDrill(profile, i);
                const contentData = {
                    ...mockData,
                    level: profile.levelId,
                    jobRoles: [normalizeJobRole(profile.job)],
                    interests: [normalizeInterest(profile.interests)],
                    grammarPatterns: [],
                    contexts: [],
                    created_at: Timestamp.now(),
                    usageCount: 1,
                    downvotes: 0,
                    generatedBy: 'mock'
                };

                try {
                    const contentRef = doc(db, 'artifacts', appId, 'contentPool', contentId);
                    await setDoc(contentRef, contentData);
                } catch (e) {
                    console.error("Error saving mock to contentPool:", e);
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
