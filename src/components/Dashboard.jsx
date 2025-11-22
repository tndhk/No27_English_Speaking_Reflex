import React from 'react';
import { Flame, Trophy, Play } from 'lucide-react';
import { PROFICIENCY_LEVELS } from '../constants/tags';
import { sanitizeInput } from '../utils/sanitization';

export const LEVELS = [
    {
        id: 'beginner',
        label: PROFICIENCY_LEVELS.beginner.label,
        subLabel: 'Basic / Travel',
        color: 'from-emerald-400 to-teal-300',
        promptInstruction: PROFICIENCY_LEVELS.beginner.promptInstruction
    },
    {
        id: 'intermediate',
        label: PROFICIENCY_LEVELS.intermediate.label,
        subLabel: 'Biz / Daily',
        color: 'from-blue-400 to-cyan-300',
        promptInstruction: PROFICIENCY_LEVELS.intermediate.promptInstruction
    },
    {
        id: 'advanced',
        label: PROFICIENCY_LEVELS.advanced.label,
        subLabel: 'Native Like',
        color: 'from-purple-400 to-pink-300',
        promptInstruction: PROFICIENCY_LEVELS.advanced.promptInstruction
    }
];

export const QUESTION_COUNTS = [5, 10, 20];

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
                        onChange={e => setProfile({ ...profile, job: sanitizeInput(e.target.value) })}
                        className="w-full bg-transparent text-center text-white font-bold placeholder-white/30 py-3 focus:outline-none text-sm"
                        placeholder="Your Job (e.g. Designer)"
                        maxLength={100}
                    />
                    <div className="h-px w-full bg-white/10"></div>
                    <input
                        type="text"
                        value={profile.interests}
                        onChange={e => setProfile({ ...profile, interests: sanitizeInput(e.target.value) })}
                        className="w-full bg-transparent text-center text-white font-bold placeholder-white/30 py-3 focus:outline-none text-sm"
                        placeholder="Your Interests (e.g. Ramen)"
                        maxLength={100}
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

export default Dashboard;
