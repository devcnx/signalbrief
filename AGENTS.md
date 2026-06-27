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

**Naming convention:** lowercase, hyphen-separated. In *branch names*, all words (including acronyms) must be lowercase. In *commit prefixes and PR titles*, only these acronyms may be uppercase: `PR`, `API`, `SQL`, `UI`, `URL`, `HTML`, `CSS`. Proper nouns (e.g., `next.js`, `typescript`, `github`) must remain lowercase unless they are one of the allowed acronyms.

**Branch naming:** `prefix/description` — exactly one slash. Use only lowercase letters, digits, and hyphens (no dots, slashes, or special characters). Slashes in commit descriptions (e.g., `shadcn/ui`) are allowed — just not in branch names.
- `phase-1/init-nextjs-app`
- `phase-2/build-source-table`
- `fix/snapshot-path-bug`
- `fix/api-endpoint-error`

**Prefix categories:** `phase-N` (sequential phases), `fix`, `feat`, `chore`, `docs`, `refactor`, `test`.

**Commit prefixes:** `prefix: short description`  
The prefix matches the branch prefix (first segment before the slash). Commit descriptions should summarize the change — they don't need to mirror the branch name verbatim. The branch description (after the slash) can be more detailed, while the PR title should be a concise summary.
- `phase-1: init next.js app with typescript`
- `phase-2: add source table component`
- `fix: correct snapshot file path`
- `fix: update API endpoint error handling`

**PR workflow:**
1. Create branch from main
2. Commit changes (atomic, prefixed commits) — each commit should represent a single logical change
3. Push branch
4. Create PR → main
5. Wait for review before merge
6. After merging, delete the feature branch

**Reviews:** PRs are reviewed by designated reviewer(s). The `pr-review-ollama` tool provides automated feedback on PRs — see `2026/Tooling/pr-review-ollama/README.md` for setup.

**Automated review flow (when pr-review-ollama is running):**
1. After creating a PR, wait ~60–90 seconds for pr-review-ollama to trigger
2. Check PR comments for review feedback
3. If there are actionable changes, present them and get explicit approval before applying
4. When applying fixes, comment on the PR describing what was changed and why — prefix comments with `**[opencode]**` to distinguish from `pr-review-ollama` comments. Only describe changes, do not include questions or approval requests in PR comments
5. Repeat until review is clean, then merge
6. If pr-review-ollama is not running (webhook down, tunnel offline, etc.), proceed with normal manual review flow

**Merge strategy:** PRs are merged using squash. The PR title must follow the same `prefix: description` format as commits. The PR number is automatically appended by GitHub.

**Examples:**

Single task:
```
branch:   phase-1/init-nextjs-app
commit:   phase-1: init next.js app with typescript
pr title: phase-1: init next.js app with typescript
squash:   phase-1: init next.js app with typescript (#42)
```

Related batch:
```
branch:   phase-1/add-tailwind-shadcn-ui-prisma
commit:   phase-1: add tailwind css
commit:   phase-1: add shadcn/ui component library
commit:   phase-1: install prisma and configure sqlite
pr title: phase-1: add tailwind, shadcn/ui, and prisma
squash:   phase-1: add tailwind, shadcn/ui, and prisma (#51)
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
