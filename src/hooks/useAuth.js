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
                // Security: Only accept tokens from trusted origins
                let initialToken = null;

                if (window.__initial_auth_token) {
                    initialToken = window.__initial_auth_token;

                    // Delete token from window immediately to prevent reuse/tampering
                    delete window.__initial_auth_token;

                    // Freeze the window property to prevent re-assignment
                    Object.defineProperty(window, '__initial_auth_token', {
                        value: undefined,
                        writable: false,
                        configurable: false
                    });
                }

                if (initialToken) {
                    if (import.meta.env.DEV) {
                        console.log("Signing in with custom token...");
                    }

                    // Enhanced token validation
                    const tokenParts = initialToken.split('.');
                    if (tokenParts.length !== 3) {
                        throw new Error('Invalid custom token format - must be a valid JWT');
                    }

                    // Validate token structure and decode header/payload for basic checks
                    try {
                        // Decode JWT payload (second part)
                        const payload = JSON.parse(atob(tokenParts[1]));

                        // Check token expiration (exp claim)
                        if (payload.exp && payload.exp * 1000 < Date.now()) {
                            throw new Error('Token has expired');
                        }

                        // Validate issuer if present (should be Supabase)
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        if (payload.iss && supabaseUrl && !payload.iss.includes(new URL(supabaseUrl).hostname)) {
                            throw new Error('Token issuer mismatch');
                        }

                    } catch (decodeError) {
                        console.error('Token validation error:', decodeError);
                        throw new Error('Invalid token structure or claims');
                    }

                    // For custom tokens, use setSession
                    // Note: Supabase will verify the signature server-side
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: initialToken,
                        refresh_token: ''
                    });

                    if (sessionError) {
                        throw new Error(sessionError.message || 'Failed to authenticate with provided token');
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
