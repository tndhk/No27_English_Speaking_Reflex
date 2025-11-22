import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * useAuth Hook
 * Handles Firebase authentication with race condition prevention
 * - Sets up auth state listener BEFORE initiating sign-in
 * - Supports both anonymous and custom token authentication
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
                    await signInWithCustomToken(auth, initialToken);
                } else {
                    if (import.meta.env.DEV) {
                        console.log("Signing in anonymously...");
                    }
                    await signInAnonymously(auth);
                }
                if (import.meta.env.DEV) {
                    console.log("Sign in call completed.");
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
                if (mounted) {
                    setAuthError(err.message);
                    setAuthStatus('error');
                }
            }
        };

        // Register listener FIRST to catch auth state changes
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (import.meta.env.DEV) {
                console.log("Auth state changed:", u ? "User logged in" : "No user");
            }
            if (mounted) {
                setUser(u);
                if (u) {
                    setAuthStatus('authenticated');
                }
            }
        });

        // Initialize auth AFTER listener is registered (prevents race condition)
        initAuth();

        // Cleanup function
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    return { user, authStatus, authError };
}
