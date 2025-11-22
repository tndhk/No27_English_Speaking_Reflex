/**
 * Vercel Serverless Function: Generate Drills via Gemini API
 * Protects Gemini API key by handling requests server-side
 *
 * This function:
 * - Receives drill generation requests from the client
 * - Calls Google Gemini API with the server-side API key
 * - Returns generated content without exposing the API key
 *
 * Environment Variables Required:
 * - GEMINI_API_KEY: Google Gemini API key (server-side only)
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_TIMEOUT_MS = 15000;

/**
 * Validates and sanitizes prompt for injection prevention
 */
function sanitizePromptInput(input, maxLength = 500) {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input.slice(0, maxLength);

    // Remove HTML/script dangerous chars
    sanitized = sanitized.replace(/[<>{}[\]\\\/`\0\x00-\x1f\x7f]/g, '');

    // Remove instruction-like patterns
    const dangerousPatterns = [
        /\b(ignore|disregard|forget|system|instruction|prompt|override|previous|new|now|instead|act\s+as|you\s+are|pretend)\b/gi,
        /[.。]\s*[A-Z]/g,
        /:{2,}|={2,}|-{3,}/g,
    ];

    dangerousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, ' ');
    });

    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    if (sanitized.length < 2 || sanitized.length > maxLength) {
        return '';
    }

    return sanitized;
}

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Validate Gemini API key exists
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Extract and validate request body
        const { count, profile, level } = req.body;

        if (!count || !profile || !profile.job || !profile.interests) {
            return res.status(400).json({
                error: 'Missing required fields: count, profile.job, profile.interests'
            });
        }

        // Validate count
        const validCounts = [5, 10, 20];
        if (!validCounts.includes(parseInt(count))) {
            return res.status(400).json({
                error: 'Invalid count. Must be 5, 10, or 20'
            });
        }

        // Validate level
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(level)) {
            return res.status(400).json({
                error: 'Invalid level. Must be beginner, intermediate, or advanced'
            });
        }

        // Sanitize inputs
        const sanitizedJob = sanitizePromptInput(profile.job, 100);
        const sanitizedInterests = sanitizePromptInput(profile.interests, 100);

        if (!sanitizedJob || !sanitizedInterests) {
            return res.status(400).json({
                error: 'Invalid job or interests - please provide valid input'
            });
        }

        // Build level-specific instruction
        const levelInstructions = {
            beginner: 'Use simple, basic vocabulary suitable for beginners. Focus on essential phrases.',
            intermediate: 'Use intermediate-level vocabulary suitable for business and daily contexts.',
            advanced: 'Use advanced vocabulary and complex sentence structures. Include idiomatic expressions.'
        };

        // Build prompt
        const prompt = `You are an English language teacher specializing in Japanese-to-English translation drills.

Generate exactly ${count} unique English drill exercises for a ${level} level student.

Student Profile:
- Job/Role: ${sanitizedJob}
- Interests: ${sanitizedInterests}

Level Guidance: ${levelInstructions[level]}

For each drill, provide ONLY valid JSON (no markdown, no code blocks, pure JSON array):
[
  {
    "jp": "Japanese sentence here",
    "en": "English translation",
    "context": "Context of use",
    "grammar": "Grammar pattern or structure"
  }
]

Requirements:
1. Make drills relevant to the student's job and interests
2. Include variety in contexts and grammar patterns
3. Keep English translations natural and idiomatic
4. Each drill should be a standalone exercise`;

        // Call Gemini API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2000
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Gemini API error (${response.status}):`, errorText);
                return res.status(503).json({
                    error: 'Failed to generate content. Please try again.'
                });
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('Unexpected Gemini response format:', data);
                return res.status(503).json({
                    error: 'Unexpected response from API'
                });
            }

            // Extract text content from response
            const responseText = data.candidates[0].content.parts[0].text;

            // Parse JSON from response (handle markdown code blocks)
            let drills;
            try {
                // Remove markdown code blocks if present
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                const jsonString = jsonMatch ? jsonMatch[0] : responseText;
                drills = JSON.parse(jsonString);
            } catch (parseError) {
                console.error('Failed to parse Gemini response:', responseText);
                return res.status(503).json({
                    error: 'Failed to parse generated content'
                });
            }

            // Validate drills format
            if (!Array.isArray(drills) || drills.length === 0) {
                return res.status(503).json({
                    error: 'No valid drills generated'
                });
            }

            // Validate and sanitize each drill
            const validatedDrills = drills.slice(0, count).map((drill, idx) => ({
                id: `gen_${Date.now()}_${idx}`,
                jp: sanitizePromptInput(drill.jp || '', 500) || 'N/A',
                en: sanitizePromptInput(drill.en || '', 500) || 'N/A',
                context: sanitizePromptInput(drill.context || '', 100) || 'General',
                grammar: sanitizePromptInput(drill.grammar || '', 100) || 'Grammar',
                level,
                job_roles: [sanitizedJob],
                interests: [sanitizedInterests],
                grammar_patterns: [sanitizePromptInput(drill.grammar || '', 100)],
                contexts: [sanitizePromptInput(drill.context || '', 100)],
                generated_by: 'gemini',
                created_at: new Date().toISOString(),
                usage_count: 0,
                downvotes: 0
            }));

            return res.status(200).json({
                success: true,
                drills: validatedDrills
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);

            if (fetchError.name === 'AbortError') {
                return res.status(504).json({
                    error: 'API request timed out. Please try again.'
                });
            }

            console.error('Fetch error:', fetchError);
            return res.status(503).json({
                error: 'Failed to generate content. Please try again.'
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}
