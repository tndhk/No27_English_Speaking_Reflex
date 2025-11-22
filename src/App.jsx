import React, { useState } from 'react';
import { X } from 'lucide-react';
import FlipCard from './components/FlipCard';
import Dashboard from './components/Dashboard';
import Completion from './components/Completion';
import { useAuth } from './hooks/useAuth';
import { useDrills } from './hooks/useDrills';
import { useGemini } from './hooks/useGemini';
import { sanitizeForSpeech } from './utils/sanitization';

export default function App() {
    const { user, authStatus, authError } = useAuth();
    const { stats, getDueDrills, saveDrillResult, assignContentToUser, recordDownvote } = useDrills(user);
    const { generateAndSaveDrills } = useGemini();

    const [status, setStatus] = useState('dashboard'); // dashboard, loading, drill, complete
    const [profile, setProfile] = useState({
        job: 'Software Engineer',
        interests: 'Startups',
        levelId: 'intermediate',
        questionCount: 5
    });
    const [sessionQueue, setSessionQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);

    const startSession = async () => {
        if (!user) return;
        setStatus('loading');

        try {
            // 1. Fetch all due reviews from contentPool
            const allDueReviews = await getDueDrills();

            // 2. Determine Queue Mix
            const targetCount = profile.questionCount;
            const reviewsToTake = allDueReviews.slice(0, targetCount);
            const slotsRemaining = targetCount - reviewsToTake.length;

            if (import.meta.env.DEV) {
                console.log("Debug: Session Start", {
                    targetCount,
                    reviewsFound: allDueReviews.length,
                    reviewsToTake: reviewsToTake.length,
                    slotsRemaining
                });
            }

            let newDrills = [];

            // Only generate if we have remaining slots
            if (slotsRemaining > 0) {
                newDrills = await generateAndSaveDrills(slotsRemaining, profile);
                // Assign generated content to user
                for (const drill of newDrills) {
                    await assignContentToUser(drill.id);
                }
            }

            const queue = [...reviewsToTake, ...newDrills];

            if (queue.length === 0) {
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
        const sanitizedText = sanitizeForSpeech(text);
        if (!sanitizedText) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(sanitizedText);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    };

    const handleRate = async (rating) => {
        const currentDrill = sessionQueue[currentIndex];

        if (user) {
            await saveDrillResult(currentDrill, rating);
        }

        if (currentIndex < sessionQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsRevealed(false);
        } else {
            setStatus('complete');
        }
    };

    // Render Logic based on Auth Status and App Status
    if (authStatus === 'loading') {
        return (
            <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
                <div className="text-white/50 animate-pulse font-bold tracking-widest">INITIALIZING...</div>
            </div>
        );
    }

    if (authStatus === 'error') {
        return (
            <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
                <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-xl border border-red-500/50">
                    <h3 className="font-bold mb-2">Initialization Error</h3>
                    <p className="text-sm opacity-80">{authError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans overflow-hidden relative">

            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-indigo-600 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-pink-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

            {/* Content Area */}
            <div className="w-full max-w-md z-10 flex flex-col items-center">

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
                            onDownvote={() => recordDownvote(sessionQueue[currentIndex].id)}
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
