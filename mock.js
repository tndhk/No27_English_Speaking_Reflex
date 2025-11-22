import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import {
  Brain,
  Check,
  ChevronRight,
  RefreshCw,
  Settings,
  Volume2,
  X,
  Zap,
  Calendar,
  Sparkles,
  Trophy,
  Flame,
  Play,
  RotateCcw,
  Layers
} from 'lucide-react';

// --- Firebase Config (Injected) ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants ---
const LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    subLabel: 'Basic / Travel',
    color: 'from-emerald-400 to-teal-300',
    promptInstruction: 'Use simple sentence structures (SVO/SVOO). Focus on basic verbs and tenses. Target CEFR A2.'
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    subLabel: 'Biz / Daily',
    color: 'from-blue-400 to-cyan-300',
    promptInstruction: 'Use standard business English structures. Present Perfect, Passive, Modals. Target CEFR B1/B2.'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    subLabel: 'Native Like',
    color: 'from-purple-400 to-pink-300',
    promptInstruction: 'Use sophisticated sentence structures. Subjunctive Mood, Idioms. Target CEFR C1.'
  }
];

const QUESTION_COUNTS = [5, 10, 20];

// --- Logic Helpers ---
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getNextReviewDate = (rating) => {
  const now = new Date();
  if (rating === 'hard') return addDays(now, 1);
  if (rating === 'soso') return addDays(now, 3);
  if (rating === 'easy') return addDays(now, 7);
  return now;
};

const generateMockDrill = (profile, idx) => ({
  jp: `これは${profile.job}向けのデモです(${idx})。`,
  en: `This is a demo sentence for a ${profile.job} (${idx}).`,
  context: 'Demo',
  grammar: 'SVO Pattern'
});

// --- Components ---

// 1. 3D Flip Card Component
const FlipCard = ({ drill, isRevealed, onReveal, onPlayAudio }) => {
  return (
    <div className="relative w-full max-w-sm aspect-[4/5] perspective-1000 group cursor-pointer" onClick={!isRevealed ? onReveal : undefined}>
      <div className={`w-full h-full transition-all duration-500 transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>

        {/* Front Side (Question) */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 hover:bg-white/15 transition-colors">
            <div className="bg-white/10 px-4 py-1 rounded-full text-xs font-bold text-white/70 tracking-widest uppercase mb-8 border border-white/10">
              Translate
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center leading-relaxed drop-shadow-md">
              {drill.jp}
            </h2>
            <div className="mt-12 flex flex-col items-center gap-2 opacity-60 animate-pulse">
              <Zap size={24} className="text-yellow-300" />
              <span className="text-sm font-medium text-white">Tap to Flip</span>
            </div>
          </div>
        </div>

        {/* Back Side (Answer) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-between p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="w-full flex justify-center mt-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                {drill.context}
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center leading-relaxed mb-6">
                {drill.en}
              </h2>
              <button
                onClick={(e) => { e.stopPropagation(); onPlayAudio(); }}
                className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 hover:bg-indigo-500 transition-all active:scale-95"
              >
                <Volume2 size={24} />
              </button>
            </div>

            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 z-10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-400 uppercase">Key Point</span>
              </div>
              <p className="text-sm font-medium text-slate-600">{drill.grammar}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Setup / Dashboard Screen
const Dashboard = ({ profile, setProfile, onStart, stats, user }) => {
  return (
    <div className="w-full max-w-md flex flex-col gap-5 p-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">
          REFLEX
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
          <Flame size={14} className="text-orange-400 fill-orange-400" />
          <span className="text-xs font-bold text-white/90">Daily Streak: {stats.totalReviewed > 0 ? 1 : 0}</span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex items-center justify-between shadow-xl">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Due Today</span>
          <span className="text-3xl font-black text-white">{stats.dueToday}</span>
        </div>
        <div className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center relative">
          <Trophy size={20} className="text-yellow-400" />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Mastered</span>
          <span className="text-3xl font-black text-white">{stats.totalReviewed}</span>
        </div>
      </div>

      {/* Settings Area */}
      <div className="space-y-4">
        {/* Inputs */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1">
          <input
            type="text"
            value={profile.job}
            onChange={e => setProfile({ ...profile, job: e.target.value })}
            className="w-full bg-transparent text-center text-white font-bold placeholder-white/30 py-3 focus:outline-none text-sm"
            placeholder="Your Job (e.g. Designer)"
          />
          <div className="h-px w-full bg-white/10"></div>
          <input
            type="text"
            value={profile.interests}
            onChange={e => setProfile({ ...profile, interests: e.target.value })}
            className="w-full bg-transparent text-center text-white font-bold placeholder-white/30 py-3 focus:outline-none text-sm"
            placeholder="Your Interests (e.g. Ramen)"
          />
        </div>

        {/* Level Selector */}
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map(lvl => (
            <button
              key={lvl.id}
              onClick={() => setProfile({ ...profile, levelId: lvl.id })}
              className={`relative overflow-hidden rounded-2xl p-2 border transition-all duration-300 h-20 flex flex-col justify-between ${profile.levelId === lvl.id
                  ? 'border-white/40 bg-white/20 shadow-lg scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
            >
              <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${lvl.color}`}></div>
              <div className="relative z-10 text-left w-full">
                <div className="font-bold text-white text-xs leading-tight">{lvl.label}</div>
                <div className="text-[9px] text-white/70 uppercase tracking-wider mt-1">{lvl.subLabel}</div>
              </div>
              {profile.levelId === lvl.id && (
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        {/* Count Selector */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {QUESTION_COUNTS.map(count => (
            <button
              key={count}
              onClick={() => setProfile({ ...profile, questionCount: count })}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${profile.questionCount === count
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'text-white/50 hover:text-white/80'
                }`}
            >
              {count} Cards
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="group relative w-full bg-white text-indigo-900 font-black text-lg py-4 rounded-2xl shadow-xl shadow-indigo-900/20 hover:shadow-indigo-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden mt-2"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          START SESSION <Play size={20} fill="currentColor" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
      </button>
    </div>
  );
};

// 3. Completion Screen
const Completion = ({ onHome, count }) => (
  <div className="text-center animate-in fade-in zoom-in duration-500">
    <div className="inline-block relative mb-8">
      <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 animate-pulse"></div>
      <Trophy size={80} className="text-yellow-300 relative z-10 drop-shadow-lg" />
    </div>
    <h2 className="text-4xl font-black text-white mb-2">Well Done!</h2>
    <p className="text-white/70 mb-8 font-medium">You completed {count} cards.</p>
    <button
      onClick={onHome}
      className="bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-3 px-8 rounded-full hover:bg-white/30 transition-all flex items-center justify-center gap-2 mx-auto"
    >
      <RotateCcw size={18} /> Back to Home
    </button>
  </div>
);


// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('auth_loading');
  // Added questionCount to profile
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

  const apiKey = "";

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && status === 'auth_loading') setStatus('dashboard');
    });
  }, []);

  useEffect(() => {
    if (!user || status !== 'dashboard') return;
    const fetchStats = async () => {
      const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'drills');
      const snapshot = await getDocs(userDrillsRef);
      const now = new Date();
      let due = 0;
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.nextReviewAt && d.nextReviewAt.toDate() <= now) due++;
      });
      setStats({ totalReviewed: snapshot.size, dueToday: due });
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
      // If User wants 10 cards:
      // Case A: 3 Reviews Due -> Take 3 Reviews + Generate 7 New
      // Case B: 15 Reviews Due -> Take 10 Reviews + Generate 0 New

      const targetCount = profile.questionCount;
      const reviewsToTake = allDueReviews.slice(0, targetCount);
      const slotsRemaining = targetCount - reviewsToTake.length;

      let newDrills = [];

      // Only generate if we have remaining slots
      if (slotsRemaining > 0) {
        if (apiKey) {
          const selectedLevel = LEVELS.find(l => l.id === profile.levelId);
          // Ask AI for exactly 'slotsRemaining' count
          const systemPrompt = `Generate ${slotsRemaining} pairs of Japanese/English sentences for a ${profile.job} interested in ${profile.interests}. Level: ${selectedLevel.label}. Constraints: ${selectedLevel.promptInstruction} Rules: JSON Array only.`;

          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
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
            const data = await response.json();
            const generated = JSON.parse(data.candidates[0].content.parts[0].text);
            newDrills = generated.map(item => ({
              ...item,
              id: `gen_${Date.now()}_${Math.random()}`,
              type: 'new',
              created_at: Timestamp.now()
            }));
          } catch (e) {
            // Fallback
            newDrills = Array.from({ length: slotsRemaining }).map((_, i) => ({ ...generateMockDrill(profile, i), id: `mock_${i}`, type: 'new' }));
          }
        } else {
          // Fallback
          newDrills = Array.from({ length: slotsRemaining }).map((_, i) => ({ ...generateMockDrill(profile, i), id: `mock_${i}`, type: 'new' }));
        }
      }

      const queue = [...reviewsToTake, ...newDrills];

      // If for some reason we have 0 items (e.g. target 0), ensure at least 1 or handle empty
      if (queue.length === 0) {
        // Edge case logic, but with min count 5 this shouldn't happen unless logic fails.
        // We could force generation here if needed.
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
      // If it's a new drill, we create a new doc. If review, we update.
      // Using setDoc with merge: true handles both roughly well, 
      // but for new drills we might want to ensure a clean ID if we used random before.
      // Logic above uses `gen_...` for ID, so it will create a new doc.

      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'drills', currentDrill.id);
      await setDoc(docRef, {
        ...currentDrill,
        lastReviewedAt: Timestamp.now(),
        nextReviewAt: Timestamp.fromDate(nextDate),
        lastRating: rating,
      }, { merge: true });
    }

    if (currentIndex < sessionQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
    } else {
      setStatus('complete');
    }
  };

  // --- Render ---
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
            <div className={`mt-8 w-full max-w-sm grid grid-cols-3 gap-4 transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
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

      {/* Custom CSS for 3D transforms */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}