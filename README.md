# VIKK Exam Thesis Assistant

AI-powered web application for VIKK IT-susteemide nooremspetsialisti students to upload thesis drafts, get structured AI evaluation, track competencies, and improve submission readiness.

## Stack

- Next.js 15 + React + TypeScript
- TailwindCSS + shadcn-style UI components
- Framer Motion + Lucide Icons
- Supabase (Auth, PostgreSQL, Storage)
- Gemini 1.5 Flash API
- `pdf-parse` and `mammoth` for thesis text extraction

## Features

- Authentication (register/login) with protected dashboard
- Thesis upload (PDF/DOCX) + automatic AI analysis
- Chunked AI pipeline (never sends whole thesis in one prompt)
- Dashboard scores: formatting, content, competencies, overall readiness
- Analysis report page with issues, missing sections, recommendations, critical risks
- Competency page with cards, progress bars, radar chart, confidence info
- Planner/checklist with deadlines and progress tracking
- Self-evaluation questionnaire with readiness recommendation
- AI mentor chat for iterative guidance
- Version history and browser PDF export

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` from `.env.example`:
```bash
# macOS/Linux
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

3. Fill environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (`theses` by default)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (`theses` by default)
- `GEMINI_API_KEY`
- `MAX_UPLOAD_MB` (default `12`)
- `MAX_ANALYSIS_CHUNKS` (default `60`)

4. Apply database schema from:
- `supabase/schema.sql`

5. Run locally:
```bash
npm run dev
```

6. Validate production build:
```bash
npm run lint
npm run typecheck
npm run build
```

## Key Directories

- `app/` routes and API endpoints
- `components/` reusable UI and feature modules
- `lib/` utilities and Supabase clients
- `services/` parsing and AI pipeline services
- `types/` shared TypeScript types
- `ai/` prompts and chunking/Gemini analysis logic
- `supabase/` SQL schema

## Deployment

Deploy to Vercel with the same environment variables configured.

## Production Notes

- API health endpoint: `GET /api/health`
- Vercel function tuning is set in `vercel.json`:
  - `app/api/thesis/analyze/route.ts` max duration `300s`
  - `app/api/mentor/route.ts` max duration `120s`
- Security response headers are configured in `next.config.ts`
- DB performance indexes are included in `supabase/schema.sql`
- Node.js engine is pinned in `package.json` (`>=20.11 <23`)

## Vercel Setup Checklist

1. Import repository into Vercel.
2. Set Framework Preset to Next.js.
3. Add all environment variables from `.env.example` to:
   - Production
   - Preview
   - Development (optional)
4. Confirm build command: `npm run build`
5. Confirm output directory: `.next` (default for Next.js)
6. Deploy and verify:
   - `/api/health` returns `{"status":"ok",...}`
   - login/register works
   - thesis upload + analysis completes
