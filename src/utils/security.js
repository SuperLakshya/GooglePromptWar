/**
 * @module security
 * @description Security utilities for input sanitization, secure ID generation,
 * and resource validation. Prevents XSS, injection, and state corruption.
 */

/**
 * Maximum allowed length for user text input (e.g., diplomacy messages).
 * @constant {number}
 */
const MAX_INPUT_LENGTH = 500;

/**
 * Regex pattern to strip HTML tags from user input.
 * @constant {RegExp}
 */
const HTML_TAG_PATTERN = /<[^>]*>/g;

/**
 * Regex pattern to strip potentially dangerous script-related attributes.
 * @constant {RegExp}
 */
const SCRIPT_PATTERN = /on\w+\s*=|javascript\s*:|data\s*:/gi;

/**
 * Sanitizes user text input by stripping HTML tags, script patterns,
 * and enforcing a maximum length.
 *
 * @param {string} text - Raw user input text
 * @param {number} [maxLength=MAX_INPUT_LENGTH] - Maximum allowed characters
 * @returns {string} Sanitized text safe for display and processing
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>Hello')
 * // Returns: 'alert("xss")Hello'
 */
export function sanitizeInput(text, maxLength = MAX_INPUT_LENGTH) {
    if (typeof text !== 'string') return '';

    let sanitized = text
        .replace(HTML_TAG_PATTERN, '')
        .replace(SCRIPT_PATTERN, '')
        .trim();

    if (sanitized.length > maxLength) {
        sanitized = sanitized.slice(0, maxLength);
    }

    return sanitized;
}

/**
 * Generates a cryptographically secure random ID string.
 * Uses `crypto.getRandomValues()` for unpredictable IDs.
 *
 * @param {string} [prefix=''] - Optional prefix for the ID (e.g., 'player', 'building')
 * @returns {string} A unique ID in the format `prefix-xxxxxxxx` or `xxxxxxxx`
 *
 * @example
 * generateSecureId('building')
 * // Returns: 'building-a3f8b2c1'
 */
export function generateSecureId(prefix = '') {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    const hex = Array.from(array)
        .map(n => n.toString(16).padStart(8, '0'))
        .join('');
    return prefix ? `${prefix}-${hex}` : hex;
}

/**
 * Validates that all resource values in an object are finite, non-negative numbers.
 * Clamps any invalid values to 0.
 *
 * @param {Object<string, number>} resources - Resource object (e.g., { food: 100, wood: 50 })
 * @returns {Object<string, number>} Validated resource object with all values >= 0
 *
 * @example
 * validateResourceValues({ food: 150, wood: -10, stone: NaN })
 * // Returns: { food: 150, wood: 0, stone: 0 }
 */
export function validateResourceValues(resources) {
    if (!resources || typeof resources !== 'object') {
        return { food: 0, wood: 0, stone: 0, gold: 0 };
    }

    const validated = {};
    for (const [key, value] of Object.entries(resources)) {
        const num = Number(value);
        validated[key] = Number.isFinite(num) && num >= 0 ? num : 0;
    }
    return validated;
}

/**
 * Validates that a coordinate pair is within map bounds.
 *
 * @param {number} q - Column coordinate
 * @param {number} r - Row coordinate
 * @param {number} maxCols - Maximum columns
 * @param {number} maxRows - Maximum rows
 * @returns {boolean} Whether coordinates are valid
 */
export function isValidCoordinate(q, r, maxCols, maxRows) {
    return (
        Number.isInteger(q) &&
        Number.isInteger(r) &&
        q >= 0 && q < maxCols &&
        r >= 0 && r < maxRows
    );
}
