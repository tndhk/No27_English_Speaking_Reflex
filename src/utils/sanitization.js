/**
 * Security utilities for input sanitization and validation
 */

const MAX_INPUT_LENGTH = 100;
const MAX_PROMPT_LENGTH = 200;

/**
 * Sanitize user input to prevent XSS and injection attacks
 * @param {string} input - The user input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input, maxLength = MAX_INPUT_LENGTH) => {
    if (!input || typeof input !== 'string') return '';

    // Trim whitespace
    let sanitized = input.trim();

    // Limit length
    sanitized = sanitized.substring(0, maxLength);

    // Remove potentially dangerous characters
    // Allow alphanumeric, spaces, and common punctuation
    sanitized = sanitized.replace(/[<>{}[\]\\\/]/g, '');

    return sanitized;
};

/**
 * Sanitize text for use in AI prompts to prevent prompt injection
 * @param {string} input - The user input to sanitize for prompts
 * @returns {string} Sanitized input safe for prompts
 */
export const sanitizeForPrompt = (input) => {
    if (!input || typeof input !== 'string') return '';

    // First apply basic sanitization
    let sanitized = sanitizeInput(input, MAX_PROMPT_LENGTH);

    // Remove or escape characters that could be used for prompt injection
    // Remove newlines, quotes, and instruction-like patterns
    sanitized = sanitized
        .replace(/[\n\r]/g, ' ')
        .replace(/["'`]/g, '')
        .replace(/\b(ignore|disregard|forget|system|instruction|prompt|override)\b/gi, '');

    // Collapse multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
};

/**
 * Validate user input
 * @param {string} input - The input to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid and error message
 */
export const validateInput = (input, options = {}) => {
    const {
        required = false,
        minLength = 0,
        maxLength = MAX_INPUT_LENGTH,
        pattern = null
    } = options;

    if (required && (!input || input.trim().length === 0)) {
        return { isValid: false, error: 'This field is required' };
    }

    if (input && input.length < minLength) {
        return { isValid: false, error: `Minimum length is ${minLength} characters` };
    }

    if (input && input.length > maxLength) {
        return { isValid: false, error: `Maximum length is ${maxLength} characters` };
    }

    if (pattern && input && !pattern.test(input)) {
        return { isValid: false, error: 'Invalid format' };
    }

    return { isValid: true, error: null };
};

/**
 * Sanitize text for speech synthesis
 * @param {string} text - Text to be spoken
 * @returns {string} Sanitized text
 */
export const sanitizeForSpeech = (text) => {
    if (!text || typeof text !== 'string') return '';

    // Remove HTML tags if any
    let sanitized = text.replace(/<[^>]*>/g, '');

    // Limit length to prevent excessively long speech
    sanitized = sanitized.substring(0, 500);

    return sanitized.trim();
};
