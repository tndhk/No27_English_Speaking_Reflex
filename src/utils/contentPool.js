import { supabase } from '../supabase';

/**
 * Saves a drill content to the shared contentPool in Supabase
 * Reusable function that eliminates duplicate code in useGemini.js
 *
 * @param {string} contentId - Unique identifier for the content
 * @param {Object} contentData - Drill data object containing:
 *   - jp: Japanese text
 *   - en: English translation
 *   - level: Proficiency level (beginner/intermediate/advanced)
 *   - job_roles: Array of job role tags
 *   - interests: Array of interest tags
 *   - grammar_patterns: Array of grammar pattern tags
 *   - contexts: Array of context tags
 *   - created_at: Timestamp when created
 *   - usage_count: Number of times used
 *   - downvotes: Number of downvotes received
 *   - generated_by: Source ('gemini' or 'mock')
 *
 * @returns {Promise<void>}
 * @throws {Error} If Supabase write fails
 *
 * @example
 * await saveContentToPool('gen_123456_0.789', {
 *   jp: 'これは例です',
 *   en: 'This is an example',
 *   level: 'intermediate',
 *   job_roles: ['software_engineer'],
 *   interests: ['technology'],
 *   grammar_patterns: ['present_simple'],
 *   contexts: ['business_meeting'],
 *   created_at: new Date().toISOString(),
 *   usage_count: 1,
 *   downvotes: 0,
 *   generated_by: 'gemini'
 * });
 */
export async function saveContentToPool(contentId, contentData) {
  try {
    const { error } = await supabase
      .from('content_pool')
      .insert({
        id: contentId,
        ...contentData
      });

    if (error) throw error;

    if (import.meta.env.DEV) {
      console.log('Content saved to pool:', contentId);
    }
  } catch (error) {
    console.error('Error saving content to pool:', contentId, error);
    // Re-throw to allow caller to handle error
    throw error;
  }
}

/**
 * Batch saves multiple drill contents to the contentPool
 * More efficient than calling saveContentToPool multiple times
 *
 * @param {Array<Object>} contentItems - Array of { contentId, contentData } objects
 * @returns {Promise<Object>} { successful: number, failed: number }
 *
 * @example
 * const results = await saveContentToPoolBatch([
 *   { contentId: 'gen_1', contentData: {...} },
 *   { contentId: 'gen_2', contentData: {...} }
 * ]);
 * console.log(`Saved ${results.successful} items, ${results.failed} failed`);
 */
export async function saveContentToPoolBatch(contentItems) {
  const results = { successful: 0, failed: 0 };

  // Create all promises
  const promises = contentItems.map(({ contentId, contentData }) =>
    saveContentToPool(contentId, contentData)
      .then(() => {
        results.successful++;
      })
      .catch(() => {
        results.failed++;
      })
  );

  // Wait for all to complete (even if some fail)
  await Promise.allSettled(promises);

  if (import.meta.env.DEV) {
    console.log('Batch save complete:', results);
  }

  return results;
}
