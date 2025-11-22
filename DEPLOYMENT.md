# Flash Speaking - Vercel + Supabase Deployment Guide

## Overview

This guide covers deploying Flash Speaking from Firebase to **Vercel** (frontend) + **Supabase** (backend database) architecture.

---

## Architecture Changes

### Before (Firebase)
```
Client ←→ Firebase Auth + Firestore
Client ←→ Gemini API (exposed key)
```

### After (Supabase + Vercel)
```
Client ←→ Vercel (Frontend) ←→ Supabase (Auth + PostgreSQL)
Client ←→ Vercel API Route ←→ Gemini API (protected key)
```

**Benefits:**
- ✅ API key protected on server
- ✅ Better rate limiting and validation
- ✅ Scalable PostgreSQL backend
- ✅ Flexible deployment options

---

## Prerequisites

1. **Supabase Account** (https://supabase.com)
2. **Vercel Account** (https://vercel.com)
3. **Google Gemini API Key** (https://makersuite.google.com/app/apikey)
4. **Git** (for version control)
5. **Node.js 18+** (for local development)

---

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project
1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization and region
4. Set database password
5. Wait for project initialization (2-3 minutes)

### 1.2 Apply Database Schema
1. Open your Supabase project
2. Go to SQL Editor
3. Create a new query and paste the contents of:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
4. Click "Run" to execute both migrations

### 1.3 Get Supabase Credentials
1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`
3. Keep `service_role_key` secret (server-side only)

### 1.4 Data Migration (Optional)
If migrating from Firebase:
```bash
# Export from Firebase
firebase firestore:export ./firebase-export

# Process and load into Supabase using custom script
node scripts/migrate-firebase-to-supabase.js
```

---

## Step 2: Set Up Vercel Deployment

### 2.1 Connect GitHub Repository
1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. Click "Import"

### 2.2 Configure Environment Variables
In Vercel Project Settings → Environment Variables, add:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

### 2.3 Build Settings
Vercel should auto-detect:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

If not, configure manually in project settings.

### 2.4 Deploy
Click "Deploy" and wait for build completion (2-5 minutes)

---

## Step 3: Configure Application

### 3.1 Update Environment Variables
Create `.env.local` for local development:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Never commit `.env` files with real keys to git

### 3.2 Update firebase.js Reference
The codebase no longer references Firebase. If you have:
```javascript
import { db, appId } from '../firebase';
```

These should be replaced with Supabase equivalents (already done in refactored code).

### 3.3 Verify API Routes
Ensure `/api/generate-drills.js` is accessible:
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/generate-drills \
  -H "Content-Type: application/json" \
  -d '{"count":5,"level":"beginner","profile":{"job":"Engineer","interests":"Tech"}}'
```

---

## Step 4: Security Checklist

- [ ] API key is server-side only (in Vercel environment variables)
- [ ] Supabase RLS policies are enabled
- [ ] No hardcoded secrets in source code
- [ ] Firebase service account keys removed
- [ ] Git history cleaned (if keys were accidentally committed)

### 4.1 Clean Git History (If Needed)
If API keys were committed to git history:

```bash
# Using BFG Repo-Cleaner
bfg --delete-files .env

# Or using git filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

---

## Step 5: Testing

### 5.1 Local Testing
```bash
# Install dependencies
npm install

# Set environment variables
export VITE_SUPABASE_URL=your-url
export VITE_SUPABASE_ANON_KEY=your-key

# Start dev server
npm run dev

# Test API endpoint
curl -X POST http://localhost:3000/api/generate-drills \
  -H "Content-Type: application/json" \
  -d '{"count":5,"level":"beginner","profile":{"job":"Designer","interests":"Art"}}'
```

### 5.2 Production Testing
1. Visit your Vercel deployment URL
2. Test authentication (should use Supabase)
3. Test drill generation (should call `/api/generate-drills`)
4. Test drill saving (should save to Supabase content_pool)
5. Test drill loading (should load from Supabase user_drills)

### 5.3 Monitor Logs
```bash
# View Vercel deployment logs
vercel logs --follow

# View Supabase database activity
# Go to Supabase dashboard → Database → Queries
```

---

## Step 6: Monitoring & Maintenance

### 6.1 Error Monitoring (Recommended)
Consider adding error tracking:
```bash
# Install Sentry
npm install @sentry/react

# Configure in src/main.jsx
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "..." });
```

### 6.2 Database Backups
Supabase automatically backs up daily. To export manually:
```bash
# Export from Supabase
pg_dump --username=postgres --format=custom \
  postgres://user:pass@db.supabasehost.com/postgres > backup.dump
```

### 6.3 Cost Monitoring
- **Vercel:** Free tier includes 100 GB bandwidth/month
- **Supabase:** Free tier includes 500 MB storage, 2M requests/month
- **Gemini API:** Pay-as-you-go ($0.075 per million input tokens)

---

## Troubleshooting

### Issue: "VITE_SUPABASE_URL is undefined"
**Solution:** Ensure environment variables are set in `.env.local` (local) or Vercel dashboard (production)

### Issue: API Key exposed in deployed code
**Solution:** Ensure `VITE_GEMINI_API_KEY` is NOT used client-side. It should only exist in Vercel environment variables for `/api/generate-drills.js`

### Issue: Supabase connection refused
**Solution:**
1. Verify Supabase is running (check Status page)
2. Check firewall/network access
3. Verify connection string includes `.co` domain

### Issue: RLS policies blocking reads
**Solution:**
1. Verify `VITE_SUPABASE_ANON_KEY` is correct anon key (not service role key)
2. Check RLS policies in Supabase dashboard
3. Ensure auth state is set before reading data

---

## Rollback Plan

If you need to rollback to Firebase:

1. Keep Firebase project running temporarily
2. Update imports back to Firebase SDK
3. Deploy to Vercel
4. Once verified, decommission Supabase

---

## Next Steps

1. **Performance:** Monitor database query performance in Supabase dashboard
2. **Analytics:** Add Google Analytics or Mixpanel for user insights
3. **A/B Testing:** Use Vercel's deployment previews for testing
4. **CI/CD:** Configure GitHub Actions for automated testing on commits

---

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Gemini API Docs:** https://ai.google.dev/
