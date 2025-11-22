# Flash Speaking

A spaced repetition language learning web application for practicing English translations of Japanese phrases. Built with React and Firebase, featuring AI-generated content, interactive flip cards, and speech synthesis for pronunciation practice.

## Features

- **Spaced Repetition Algorithm** - Intelligently schedule reviews based on difficulty
- **3D Flip Cards** - Interactive card-based learning interface with smooth animations
- **AI Content Generation** - Google Gemini API generates personalized drills based on user profile
- **Speech Synthesis** - Built-in browser text-to-speech for pronunciation practice
- **Firebase Integration** - Secure authentication and Firestore database for progress tracking
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark Theme** - Beautiful gradient effects and glassmorphism UI

## Tech Stack

- **Frontend**: React 19 (hooks-based, no TypeScript)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 with custom 3D CSS animations
- **Backend**: Firebase 12 (Authentication + Firestore)
- **AI**: Google Gemini 2.5 Flash API
- **Icons**: Lucide React
- **Audio**: Web Speech Synthesis API

## Installation

```bash
# Clone the repository
git clone https://github.com/tndhk/No27_English_Speaking_Reflex.git
cd No27_English_Speaking_Reflex

# Install dependencies
npm install

# Create .env file with Gemini API key
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env
```

## Development

```bash
# Start development server
npm run dev
# Open http://localhost:5173 in your browser

# Run ESLint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.jsx                 # Main orchestrator and state machine
├── main.jsx               # React entry point
├── firebase.js            # Firebase configuration
├── utils.js               # Utility functions (spaced repetition, mocks)
├── index.css              # Global styles + 3D flip animation
├── components/
│   ├── FlipCard.jsx       # 3D flip card component
│   ├── Dashboard.jsx      # User settings and session start
│   └── Completion.jsx     # Session completion screen
├── vite.config.js         # Vite configuration
└── tailwind.config.js     # Tailwind theme
```

## How It Works

### Application Flow

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

### Spaced Repetition Schedule

- **Hard**: Review in 1 day
- **Good**: Review in 3 days
- **Easy**: Review in 7 days

### Content Generation

**Primary Method**: Google Gemini API
- Generates JSON array of Japanese/English sentence pairs
- Personalized based on user's job, interests, and proficiency level
- API key via `VITE_GEMINI_API_KEY` environment variable

**Fallback Method**: Mock generation (if API fails or no key provided)
- Simple template-based drills
- Still personalized by user's job
- Useful for testing and offline development

### Data Structure (Firestore)

```
artifacts/{appId}/users/{userId}/drills/{drillId}
├── jp: string              # Japanese text
├── en: string              # English translation
├── context: string         # Usage context
├── grammar: string         # Grammar key point
├── type: 'review' | 'new'  # Drill type
├── created_at: Timestamp   # Creation date
├── lastReviewedAt: Timestamp
├── nextReviewAt: Timestamp # Used to filter due drills
└── lastRating: 'hard' | 'soso' | 'easy'
```

## Audio Playback

The application uses the browser's built-in **Web Speech Synthesis API** for text-to-speech:

- **Automatic Playback**: Audio plays automatically when a card is revealed
- **Manual Playback**: Users can click the speaker button to replay
- **Language**: English (en-US)
- **No External Files**: No audio files are stored; synthesis happens in real-time

## Environment Variables

Create a `.env` file in the project root:

```
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

**Note**: The `.env` file is in `.gitignore` and should not be committed.

## Firebase Setup

The app uses Firebase for authentication and data persistence:

1. Configure Firebase credentials in `src/firebase.js`
2. Set up Firestore database structure as described above
3. Enable anonymous authentication in Firebase Console

## State Management

The application uses React hooks with prop drilling:
- No Redux, Context API, or other global state libraries
- All state is managed in `App.jsx` and passed down to child components
- Simple and effective for this single-feature application

## Styling Approach

- **Tailwind CSS**: Component utility classes
- **Custom CSS** (`index.css`): 3D transforms for flip animations
- **GPU Acceleration**: Uses `transform` and `blur` for smooth 60fps animations
- **Dark Theme**: Slate-900 background with gradient overlays

## Performance

- Lazy loads drills only when session starts
- Vite HMR for fast development feedback
- Production build optimized with code splitting
- GPU-accelerated CSS animations

## Error Handling

- Gracefully falls back to mock data if Gemini API fails
- Firebase errors are caught and displayed to users
- Console logging for debugging

## Browser Support

Works on all modern browsers with:
- CSS 3D Transforms support
- Web Speech Synthesis API support
- ES6+ JavaScript support

## License

MIT

## Author

Takahiko Tsunoda

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
