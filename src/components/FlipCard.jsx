import React from 'react';
import { Volume2, Zap, Sparkles, ThumbsDown } from 'lucide-react';

const FlipCard = ({ drill, isRevealed, onReveal, onPlayAudio, onDownvote }) => {
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

                        <div className="w-full flex flex-col gap-3 z-10">
                            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <span className="text-xs font-bold text-slate-400 uppercase">Key Point</span>
                                </div>
                                <p className="text-sm font-medium text-slate-600">{drill.grammar}</p>
                            </div>
                            {onDownvote && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDownvote(); }}
                                    className="w-full py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <ThumbsDown size={16} />
                                    Not helpful
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlipCard;
