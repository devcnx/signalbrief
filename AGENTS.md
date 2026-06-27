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

## Branching and PR workflow

**Never push directly to main.** All work goes through branches and PRs.

**Naming convention:** lowercase, hyphen-separated. Prefer lowercase for acronyms (e.g., `api`, `sql`) to keep names consistent, but uppercase is acceptable if the acronym is widely recognized (e.g., `PR`, `API`).

**Branch naming:** `prefix/task-description`
- `phase-1/init-nextjs-app`
- `phase-2/build-source-table`
- `fix/snapshot-path-bug`
- `fix/api-endpoint-error`

**Commit prefixes:** `prefix: short description`  
The prefix is the first segment of the branch name—the part before the first `/` (e.g., `phase-1`, `fix`).
- `phase-1: init next.js app with typescript`
- `phase-2: add source table component`
- `fix: correct snapshot file path`
- `fix: update API endpoint error handling`

**PR workflow:**
1. Create branch from main
2. Commit changes (atomic, prefixed commits)
3. Push branch
4. Create PR → main
5. Wait for review before merge

**Reviews:** Reviews are performed by Brittaney or other team members. The `pr-review-ollama` tool provides automated feedback on PRs (requires initial setup).

**Merge strategy:** PRs are merged using squash. Use the PR title as the squash commit message (follows the same prefix convention).

**Examples:**

Single task:
```
branch:  phase-1/init-nextjs-app
commit:  phase-1: init next.js app with typescript
pr:      phase-1: init next.js app with typescript (#42)
```

Related batch:
```
branch:  phase-1/add-tailwind-shadcn-ui-prisma
commit:  phase-1: add tailwind css
commit:  phase-1: add shadcn/ui component library
commit:  phase-1: install prisma and configure sqlite
pr:      phase-1: add tailwind, shadcn/ui, and prisma (#51)
```

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
