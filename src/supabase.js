import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 * Manages connection to Supabase PostgreSQL database and authentication
 *
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Anonymous key for client-side access
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required configuration
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing required Supabase configuration. ' +
        'Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
}

/**
 * Supabase client instance
 * Used for authentication, database queries, and real-time subscriptions
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to get current user session
 * @returns {Promise<Object|null>} Current user session or null
 */
export async function getCurrentSession() {
    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error.message);
        return null;
    }

    return session;
}

/**
 * Helper function to get current user
 * @returns {Promise<Object|null>} Current authenticated user or null
 */
export async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error.message);
        return null;
    }

    return user;
}
