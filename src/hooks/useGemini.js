import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { LEVELS } from '../components/Dashboard';
import { generateMockDrill } from '../utils';

export function useGemini() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    const generateDrills = async (count, profile) => {
        setLoading(true);
        setError(null);
        let newDrills = [];

        try {
            if (apiKey) {
                console.log("Debug: Attempting generation with Gemini...");
                const selectedLevel = LEVELS.find(l => l.id === profile.levelId);
                const systemPrompt = `Generate ${count} pairs of Japanese/English sentences for a ${profile.job} interested in ${profile.interests}. Level: ${selectedLevel.label}. Constraints: ${selectedLevel.promptInstruction} Rules: JSON Array of objects with keys "en" (English) and "jp" (Japanese).`;

                console.log("Debug: Starting fetch to Gemini...");
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

                console.log("Debug: Fetch completed. Status:", response.status);

                if (!response.ok) {
                    const text = await response.text();
                    console.log("Debug: API Error Response Body:", text);
                    throw new Error(`API Error: ${response.status} - ${text}`);
                }

                const data = await response.json();
                console.log("Debug: API Data received", data);

                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error("Invalid API response format");
                }

                let rawText = data.candidates[0].content.parts[0].text;
                console.log("Debug: Raw Gemini Text:", rawText);

                // Clean up markdown code blocks if present
                rawText = rawText.replace(/```json\n?|```/g, '').trim();

                const generated = JSON.parse(rawText);
                newDrills = generated.map(item => ({
                    ...item,
                    // Handle potential key variations
                    en: item.en || item.english,
                    jp: item.jp || item.japanese,
                    id: `gen_${Date.now()}_${Math.random()}`,
                    type: 'new',
                    created_at: Timestamp.now()
                }));
            } else {
                // No API key, fallback to mock
                newDrills = Array.from({ length: count }).map((_, i) => ({ ...generateMockDrill(profile, i), id: `mock_${i}`, type: 'new' }));
            }
        } catch (e) {
            console.log("Debug: Gemini API ERROR CAUGHT:", e);
            setError(e.message);
            // Fallback to mock data on error
            newDrills = Array.from({ length: count }).map((_, i) => ({ ...generateMockDrill(profile, i), id: `mock_${i}`, type: 'new' }));
        } finally {
            setLoading(false);
        }

        return newDrills;
    };

    return { generateDrills, loading, error };
}
