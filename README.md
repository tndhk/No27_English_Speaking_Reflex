# Flash Speaking

A spaced repetition language learning web application for practicing English translations of Japanese phrases. Built with React and Supabase, featuring AI-generated content via Google Gemini, interactive flip cards, and speech synthesis for pronunciation practice.

## Features

- **Spaced Repetition Algorithm** - Intelligently schedule reviews based on difficulty
- **3D Flip Cards** - Interactive card-based learning interface with smooth animations
- **AI Content Generation** - Google Gemini API generates personalized drills based on user profile
- **Speech Synthesis** - Built-in browser text-to-speech for pronunciation practice
- **Supabase Integration** - PostgreSQL database with Row Level Security (RLS) for secure authentication and progress tracking
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark Theme** - Beautiful gradient effects and glassmorphism UI

## Tech Stack

- **Frontend**: React 19 (hooks-based, no TypeScript)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 with custom 3D CSS animations
- **Backend**: Supabase (PostgreSQL + Authentication)
- **API Proxy**: Vercel Serverless Functions (Node.js)
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

# Create .env.local file with Supabase credentials
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF

# Note: GEMINI_API_KEY is configured on Vercel (server-side only, not in .env)
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
├── supabase.js            # Supabase client initialization
├── utils.js               # Utility functions (spaced repetition, mocks)
├── index.css              # Global styles + 3D flip animation
├── components/
│   ├── FlipCard.jsx       # 3D flip card component
│   ├── Dashboard.jsx      # User settings and session start
│   └── Completion.jsx     # Session completion screen
├── hooks/
│   ├── useAuth.js         # Supabase authentication hook
│   ├── useDrills.js       # Drill data management hook
│   └── useGemini.js       # AI drill generation hook
├── utils/
│   └── contentPool.js     # Content pool management
├── vite.config.js         # Vite configuration
└── tailwind.config.js     # Tailwind theme

api/
├── generate-drills.js     # Vercel serverless function for Gemini API

supabase/
└── migrations/
    ├── 001_initial_schema.sql       # Database schema (flash_speaking)
    └── 002_rls_policies.sql         # Row Level Security policies
```

## How It Works

### Application Flow

```
User Authentication (Supabase Auth)
    ↓
Load Drills from PostgreSQL (due + new via optimized JOIN query)
    ↓
Generate Content (Vercel API → Google Gemini API with fallback to mocks)
    ↓
Display Drill Session (FlipCard components)
    ↓
Update PostgreSQL with Review Ratings & Next Review Dates (via Supabase)
    ↓
Display Completion Screen
```

### Architecture Highlights

- **Server-Side API Key Protection**: Gemini API key stored in Vercel environment variables only
- **Optimized Database Queries**: Single SQL JOIN replaces N+1 Firestore pattern
- **Row Level Security**: PostgreSQL RLS policies enforce data isolation at database level
- **Separate Schema**: `flash_speaking` schema isolates data from other projects in shared Supabase instance

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

### Data Structure (PostgreSQL - flash_speaking schema)

**content_pool** (shared drill content)
```
id: UUID (primary key)
jp: text                    # Japanese text
en: text                    # English translation
level: VARCHAR              # 'beginner', 'intermediate', 'advanced'
job_roles: TEXT[]           # Array of job roles
interests: TEXT[]           # Array of interests
grammar_patterns: TEXT[]    # Grammar structures
contexts: TEXT[]            # Usage contexts
generated_by: VARCHAR       # 'gemini' or 'mock'
created_at: TIMESTAMP
usage_count: INTEGER
downvotes: INTEGER
```

**user_drills** (user's progress per content)
```
id: UUID (primary key)
user_id: UUID (references auth.users)
content_id: UUID (references content_pool)
next_review_at: TIMESTAMP   # Used to filter due drills
last_reviewed_at: TIMESTAMP
last_rating: VARCHAR        # 'hard', 'soso', 'easy'
review_count: INTEGER
created_at: TIMESTAMP
```

**users** (user profile metadata)
```
id: UUID (primary key, references auth.users)
job: VARCHAR
interests: VARCHAR
level: VARCHAR              # 'beginner', 'intermediate', 'advanced'
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## Audio Playback

The application uses the browser's built-in **Web Speech Synthesis API** for text-to-speech:

- **Automatic Playback**: Audio plays automatically when a card is revealed
- **Manual Playback**: Users can click the speaker button to replay
- **Language**: English (en-US)
- **No External Files**: No audio files are stored; synthesis happens in real-time

## Environment Variables

### Local Development (.env.local)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note**: The `.env.local` file is in `.gitignore` and should not be committed.

### Production (Vercel)

Configure on Vercel dashboard:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your_google_gemini_api_key  # Server-side only
```

**Important**: `GEMINI_API_KEY` should NOT have the `VITE_` prefix, ensuring it's only accessible on the server.

## Supabase Setup

The app uses Supabase for authentication and data persistence:

1. Create a Supabase project at https://supabase.com
2. Run migrations in SQL Editor:
   - `supabase/migrations/001_initial_schema.sql` (creates flash_speaking schema)
   - `supabase/migrations/002_rls_policies.sql` (sets up RLS policies)
3. Copy Project URL and anon key to `.env.local`
4. Enable anonymous authentication in Supabase Auth settings

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

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
