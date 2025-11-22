import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authenticated', 'error'
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
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
                setAuthError(err.message);
                setAuthStatus('error');
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (import.meta.env.DEV) {
                console.log("Auth state changed:", u ? "User logged in" : "No user");
            }
            setUser(u);
            if (u) {
                setAuthStatus('authenticated');
            }
        });

        initAuth();
        return () => unsubscribe();
    }, []);

    return { user, authStatus, authError };
}
