import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { X } from 'lucide-react';
import { auth, db, appId } from './firebase';
import { addDays, getNextReviewDate, generateMockDrill } from './utils';
import FlipCard from './components/FlipCard';
import Dashboard, { LEVELS } from './components/Dashboard';
import Completion from './components/Completion';

export default function App() {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('auth_loading');
    const [profile, setProfile] = useState({
        job: 'Software Engineer',
        interests: 'Startups',
        levelId: 'intermediate',
        questionCount: 5
    });
    const [sessionQueue, setSessionQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [stats, setStats] = useState({ totalReviewed: 0, dueToday: 0 });

    // TODO: Get API key from environment or secure source
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                console.log("Starting auth initialization...");
                // Check for initial auth token if passed from parent context
                const initialToken = window.__initial_auth_token;

                if (initialToken) {
                    console.log("Signing in with custom token...");
                    await signInWithCustomToken(auth, initialToken);
                } else {
                    console.log("Signing in anonymously...");
                    await signInAnonymously(auth);
                }
                console.log("Sign in call completed.");
            } catch (err) {
                console.error("Auth initialization error:", err);
                setError(err.message);
                setStatus('error');
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (u) => {
            console.log("Auth state changed:", u ? "User logged in" : "No user");
            setUser(u);
            if (u) {
                setStatus('dashboard');
            }
        });

        initAuth();
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user || status !== 'dashboard') return;
        const fetchStats = async () => {
            try {
                const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'drills');
                const snapshot = await getDocs(userDrillsRef);
                const now = new Date();
                let due = 0;
                snapshot.forEach(doc => {
                    const d = doc.data();
                    if (d.nextReviewAt && d.nextReviewAt.toDate() <= now) due++;
                });
                setStats({ totalReviewed: snapshot.size, dueToday: due });
            } catch (error) {
                console.error("Error fetching stats:", error);
                // Handle error gracefully, maybe set stats to 0
                setStats({ totalReviewed: 0, dueToday: 0 });
            }
        };
        fetchStats();
    }, [user, status]);

    const startSession = async () => {
        if (!user) return;
        setStatus('loading');

        try {
            // 1. Fetch all due reviews
            const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'drills');
            const snapshot = await getDocs(userDrillsRef);
            const now = new Date();
            const allDueReviews = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.nextReviewAt && data.nextReviewAt.toDate() <= now) {
                    allDueReviews.push({ ...data, id: doc.id, type: 'review' });
                }
            });

            // 2. Determine Queue Mix
            const targetCount = profile.questionCount;
            const reviewsToTake = allDueReviews.slice(0, targetCount);
            const slotsRemaining = targetCount - reviewsToTake.length;

            console.log("Debug: Session Start", {
                targetCount,
                reviewsFound: allDueReviews.length,
                reviewsToTake: reviewsToTake.length,
                slotsRemaining,
                hasApiKey: !!apiKey,
                apiKeyLength: apiKey ? apiKey.length : 0
            });

            let newDrills = [];

            // Only generate if we have remaining slots
            if (slotsRemaining > 0) {
                if (apiKey) {
                    console.log("Debug: Attempting generation with Gemini...");
                    const selectedLevel = LEVELS.find(l => l.id === profile.levelId);
                    const systemPrompt = `Generate ${slotsRemaining} pairs of Japanese/English sentences for a ${profile.job} interested in ${profile.interests}. Level: ${selectedLevel.label}. Constraints: ${selectedLevel.promptInstruction} Rules: JSON Array of objects with keys "en" (English) and "jp" (Japanese).`;

                    try {
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
                    } catch (e) {
                        console.log("Debug: Gemini API ERROR CAUGHT:", e);
                        // Fallback to mock data
                        newDrills = Array.from({ length: slotsRemaining }).map((_, i) => ({ ...generateMockDrill(profile, i), id: `mock_${i}`, type: 'new' }));
                    }
                } else {
                    newDrills = Array.from({ length: slotsRemaining }).map((_, i) => ({ ...generateMockDrill(profile, i), id: `mock_${i}`, type: 'new' }));
                }
            }

            const queue = [...reviewsToTake, ...newDrills];

            if (queue.length === 0) {
                // Fallback if queue is empty (shouldn't happen with mock generation)
                setStatus('dashboard');
                return;
            }

            setSessionQueue(queue);
            setCurrentIndex(0);
            setIsRevealed(false);
            setStatus('drill');

        } catch (err) {
            console.error(err);
            setStatus('dashboard');
        }
    };

    const playAudio = (text) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    };

    const handleRate = async (rating) => {
        const currentDrill = sessionQueue[currentIndex];
        const nextDate = getNextReviewDate(rating);

        if (user) {
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'drills', currentDrill.id);
                await setDoc(docRef, {
                    ...currentDrill,
                    lastReviewedAt: Timestamp.now(),
                    nextReviewAt: Timestamp.fromDate(nextDate),
                    lastRating: rating,
                }, { merge: true });
            } catch (e) {
                console.error("Error saving drill progress:", e);
                // Optional: alert(`Error saving progress: ${e.message}`);
            }
        }

        if (currentIndex < sessionQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsRevealed(false);
        } else {
            setStatus('complete');
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans overflow-hidden relative">

            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-indigo-600 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-pink-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

            {/* Content Area */}
            <div className="w-full max-w-md z-10 flex flex-col items-center">

                {status === 'auth_loading' && (
                    <div className="text-white/50 animate-pulse font-bold tracking-widest">INITIALIZING...</div>
                )}

                {status === 'error' && (
                    <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-xl border border-red-500/50">
                        <h3 className="font-bold mb-2">Initialization Error</h3>
                        <p className="text-sm opacity-80">{error}</p>
                        <p className="text-xs mt-4 text-white/50">Check console for details.</p>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                        <p className="text-white font-bold text-lg">Building Deck...</p>
                    </div>
                )}

                {status === 'dashboard' && (
                    <Dashboard
                        profile={profile}
                        setProfile={setProfile}
                        onStart={startSession}
                        stats={stats}
                        user={user}
                    />
                )}

                {status === 'complete' && (
                    <Completion
                        onHome={() => setStatus('dashboard')}
                        count={sessionQueue.length}
                    />
                )}

                {status === 'drill' && sessionQueue.length > 0 && (
                    <>
                        {/* Progress Bar */}
                        <div className="w-full max-w-sm mb-6 flex items-center gap-3">
                            <button onClick={() => setStatus('dashboard')} className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
                                <X size={20} />
                            </button>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${((currentIndex + 1) / sessionQueue.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-white/50 font-mono">
                                {currentIndex + 1}/{sessionQueue.length}
                            </span>
                        </div>

                        <FlipCard
                            drill={sessionQueue[currentIndex]}
                            isRevealed={isRevealed}
                            onReveal={() => { setIsRevealed(true); playAudio(sessionQueue[currentIndex].en); }}
                            onPlayAudio={() => playAudio(sessionQueue[currentIndex].en)}
                        />

                        {/* Action Buttons (Only visible after reveal) */}
                        <div className={`mt-8 w-full max-w-sm grid grid-cols-3 gap-4 transition-all duration-500 z-50 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                            <button
                                onClick={() => handleRate('hard')}
                                className="group flex flex-col items-center p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/40 hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="text-xl font-black group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all">1 Day</span>
                                <span className="text-[10px] uppercase font-bold opacity-70">Hard</span>
                            </button>

                            <button
                                onClick={() => handleRate('soso')}
                                className="group flex flex-col items-center p-3 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/40 hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="text-xl font-black group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] transition-all">3 Days</span>
                                <span className="text-[10px] uppercase font-bold opacity-70">Good</span>
                            </button>

                            <button
                                onClick={() => handleRate('easy')}
                                className="group flex flex-col items-center p-3 rounded-2xl bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/40 hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="text-xl font-black group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-all">7 Days</span>
                                <span className="text-[10px] uppercase font-bold opacity-70">Easy</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
