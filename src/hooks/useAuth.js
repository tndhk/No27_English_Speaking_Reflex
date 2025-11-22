import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * useAuth Hook
 * Handles Supabase authentication with race condition prevention
 * - Sets up auth state listener BEFORE initiating sign-in
 * - Supports both anonymous (magic link) and custom token authentication
 * @returns {Object} { user, authStatus, authError }
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authenticated', 'error'
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let mounted = true; // Track if component is mounted to prevent state updates after unmount

        /**
         * Initializes authentication
         * Called AFTER onAuthStateChanged listener is registered to prevent race conditions
         */
        const initAuth = async () => {
            try {
                if (import.meta.env.DEV) {
                    console.log("Starting auth initialization...");
                }

                // Check for initial auth token if passed from parent context
                const initialToken = window.__initial_auth_token;

                if (initialToken) {
                    if (import.meta.env.DEV) {
                        console.log("Signing in with custom token...");
                    }

                    // Validate token format - Supabase JWTs have 3 parts separated by dots
                    const tokenParts = initialToken.split('.');
                    if (tokenParts.length !== 3) {
                        throw new Error('Invalid custom token format');
                    }

                    // For custom tokens, use setSession instead
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: initialToken,
                        refresh_token: ''
                    });

                    if (sessionError) {
                        throw new Error(sessionError.message || 'Failed to set session');
                    }
                } else {
                    if (import.meta.env.DEV) {
                        console.log("Signing in with anonymous session...");
                    }

                    // For anonymous access, Supabase will use the anon key
                    // No explicit sign-in needed - auth state listener will catch it
                }

                if (import.meta.env.DEV) {
                    console.log("Auth initialization completed.");
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
                if (mounted) {
                    setAuthError(err.message || 'Authentication failed');
                    setAuthStatus('error');
                }
            }
        };

        // Register listener FIRST to catch auth state changes
        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (import.meta.env.DEV) {
                console.log("Auth state changed:", event, session?.user?.id);
            }

            if (mounted) {
                if (session?.user) {
                    setUser(session.user);
                    setAuthStatus('authenticated');
                    setAuthError(null);
                } else {
                    setUser(null);
                    setAuthStatus('unauthenticated');
                }
            }
        });

        // Initialize auth AFTER listener is registered (prevents race condition)
        initAuth();

        // Cleanup function
        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    return { user, authStatus, authError };
}
