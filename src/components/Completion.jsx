import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';

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

export default Completion;
