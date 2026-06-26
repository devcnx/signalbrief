# AGENTS.md — SignalBrief

## What this is

Local-first AI documentation monitoring dashboard. Monitors approved sources, detects changes, generates reviewable newsletter drafts.

**Not** a web crawler, email spam machine, or generic news scraper. Controlled change detection with a newsletter output layer.

## Stack

Next.js (App Router) · React · TypeScript · SQLite · Prisma · Tailwind CSS · shadcn/ui

## Setup

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

## Build order (do not skip steps)

1. Init Next.js + TypeScript
2. Add Tailwind, shadcn/ui
3. Add Prisma + SQLite
4. Create schema (use `repo_scaffold/prisma/schema.prisma`)
5. Seed starter sources
6. Build source registry UI
7. Add manual scan (`/api/runs/start`)
8. Save snapshots + hashes
9. Diff against previous snapshot
10. Run history + diff viewer
11. Newsletter draft generation
12. AI summarization (optional)
13. Markdown + HTML export

## Key constraints

- **Local-only.** No auth, no cloud DB, no multi-user.
- **Manual trigger.** No scheduling, no auto-email in MVP.
- **Approved sources only.** Never crawl from a root URL.
- **Server-side fetching.** Source fetcher runs in Route Handlers, not the browser (CORS, security).
- **AI is optional.** App works without API key — falls back to raw change output.
- **Every newsletter item needs a source URL.** No unsourced AI claims.

## Packet docs

Full specs live in `ai-newsletter-local-web-app-packet/`:

- `01_IMPLEMENTATION_PACKET.md` — full build strategy
- `02_PRODUCT_REQUIREMENTS.md` — user stories, acceptance criteria
- `03_TECHNICAL_ARCHITECTURE.md` — routes, modules, data flow
- `04_SQLITE_DATABASE_DESIGN.md` — schema rationale
- `05_MVP_BACKLOG_AND_ROADMAP.md` — phased backlog
- `06_PROMPT_AND_GUARDRAIL_SPEC.md` — AI prompt + guardrails
- `07_TESTING_AND_ACCEPTANCE_CHECKLIST.md` — QA checklist

## Scaffold files

Copy from `repo_scaffold/` when initializing:

- `prisma/schema.prisma` — 7 models (Source, Run, Snapshot, DetectedChange, Newsletter, NewsletterItem, Setting)
- `config/starter-sources.ts` — 4 seed sources (OpenAI, Anthropic, Google, Microsoft)
- `lib/types.ts` — TypeScript interfaces
- `prompts/summarize-change.md` — AI prompt template
- `.env.example` — env vars (DATABASE_URL, optional AI_PROVIDER/OPENAI_API_KEY/ANTHROPIC_API_KEY)

## Data layout

```
data/
├── ai-newsletter.sqlite    # gitignored
├── snapshots/{sourceId}/   # raw.html + cleaned.txt per snapshot
├── exports/markdown/       # exported .md newsletters
├── exports/html/           # exported .html newsletters
└── logs/
```

## GitHub project

Kanban board: https://github.com/users/devcnx/projects/6
Milestones: Phase 1–7 + Portfolio Readiness

## Service modules (to build)

```
lib/
├── db.ts                   # Prisma client
├── source-fetcher.ts       # server-side fetch
├── content-cleaner.ts      # Cheerio HTML extraction
├── snapshot-storage.ts     # file I/O for snapshots
├── diff-engine.ts          # jsdiff comparison
├── change-classifier.ts    # significance classification
├── summarizer.ts           # AI provider adapter
├── newsletter-builder.ts   # template assembly
├── exporters.ts            # .md/.html file output
└── validators.ts           # input/output validation
```
