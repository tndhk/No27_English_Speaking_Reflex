# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Flash Speaking** is a spaced repetition language learning web application for practicing English translations of Japanese phrases. Built with React and Firebase, it features AI-generated content, interactive flip cards, and speech synthesis for pronunciation practice.

## Common Commands

```bash
npm run dev       # Start development server (http://localhost:5173)
npm run build     # Create optimized production bundle in /dist
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint to check code quality
```

## Architecture Overview

### High-Level Data Flow

```
User Authentication (Firebase)
    ↓
Load Drills from Firestore (due + new)
    ↓
Generate Content (Google Gemini API with fallback to mocks)
    ↓
Display Drill Session (FlipCard components)
    ↓
Update Firestore with Review Ratings & Next Review Dates
    ↓
Display Completion Screen
```

### Component Hierarchy

- **App.jsx** - Root orchestrator that manages the entire application state machine:
  - `auth_loading` → Authenticates user (anonymous or custom token)
  - `dashboard` → Settings and session configuration
  - `loading` → Fetches drills and generates new content
  - `drill` → Interactive card review loop
  - `complete` → Session completion confirmation

- **Dashboard.jsx** - User settings (job, interests, proficiency level, question count)
- **FlipCard.jsx** - Interactive 3D flip card with audio playback and rating buttons
- **Completion.jsx** - Success screen showing session stats

### Technology Stack

- **React 19** - UI framework (hooks-based, no TypeScript)
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Styling (with custom 3D CSS for flip animation)
- **Firebase 12** - Authentication + Firestore database
- **Google Gemini API** - AI content generation (v2.5 flash preview)
- **Lucide React** - Icon library
- **Web Speech Synthesis API** - Built-in browser audio

### Key Algorithms & Patterns

**Spaced Repetition (src/utils.js)**
- Hard: Review in 1 day
- Good: Review in 3 days
- Easy: Review in 7 days

**Content Generation**
- Primary: Calls Google Gemini with user proficiency level constraints
- Fallback: Generates mock drills personalized by user's job/interests
- API key via `VITE_GEMINI_API_KEY` environment variable

**Authentication**
- Anonymous auth by default
- Supports custom token via `window.__initial_auth_token` (for embedding)

**Database Structure (Firestore)**
```
artifacts/{appId}/users/{userId}/drills/{drillId}
├── jp: string (Japanese)
├── en: string (English translation)
├── context: string
├── grammar: string
├── type: 'review' | 'new'
├── created_at: Timestamp
├── lastReviewedAt: Timestamp
├── nextReviewAt: Timestamp (used to filter due drills)
└── lastRating: 'hard' | 'soso' | 'easy'
```

### Key Files

| File | Purpose |
|------|---------|
| `src/main.jsx` | React entry point |
| `src/App.jsx` | State machine orchestrator (500+ lines) |
| `src/firebase.js` | Firebase initialization |
| `src/utils.js` | Utility functions (date math, spaced repetition, mock generation) |
| `src/index.css` | Global styles + 3D flip animation CSS |
| `src/components/` | Reusable React components |
| `vite.config.js` | Vite + React plugin config |
| `tailwind.config.js` | Tailwind theme configuration |
| `mock.js` | Self-contained module version for external use |

## Development Notes

**State Management**
- Uses React hooks (`useState`) with prop drilling
- No Redux, Context, or other global state library
- State lifted to App.jsx and passed to child components
- Simple and effective for this single-feature application

**Styling**
- Tailwind CSS for component utilities
- Custom CSS in `index.css` for 3D transforms (e.g., `backface-visibility`, `rotateY`)
- Dark theme with slate-900 background
- Gradient overlays and blur effects for visual polish

**3D Flip Card Animation**
- Uses CSS `transform: rotateY()` for the flip effect
- Perspective applied to parent container
- Backface visibility hidden for smooth 3D appearance
- Smooth transitions on `.flip-card` state change

**Error Handling**
- Gracefully falls back to mock data if Gemini API fails
- Firebase errors caught and displayed to user
- Console logging for debugging

**Performance Considerations**
- Lazy loads drills only when session starts
- GPU-accelerated animations (transform, blur)
- Vite dev server supports fast HMR
- Production build optimized with code splitting

## Firebase Setup

The app uses Firebase configuration embedded in `src/firebase.js`. Authentication is tied to user ID stored in Firestore under `artifacts/{appId}/users/{userId}/`.

To deploy or modify:
1. Update Firebase config in `src/firebase.js` if needed
2. Ensure Firestore has proper structure (see Database Structure section above)
3. Set Gemini API key via environment variable for production deployment

## Testing & Debugging

- Run `npm run lint` to check for code issues
- Use browser DevTools to inspect React state and Firebase queries
- Mock data generation useful for testing without API calls
- Vite dev server shows errors in terminal and browser console
