# SignalBrief: Local AI Newsletter Web App Implementation Packet

## 1. Executive summary

**SignalBrief** is a local-first web application that monitors approved AI documentation and release-note sources, detects meaningful changes, and generates a reviewable newsletter draft. The app runs locally on a personal device, uses SQLite for persistent memory, and is manually triggered by the user.

The purpose is to create a portfolio-grade project that demonstrates practical AI enablement, automation design, web application architecture, local persistence, source-grounded summarization, and responsible use of AI-generated content.

## 2. Project objective

Build a local web app that helps users answer:

> "What changed across the AI tools and documentation sources I care about since the last time I checked?"

The first version should produce a high-quality newsletter draft, not automatically send emails or run on a schedule.

## 3. Target outcome

A working local Next.js application that can:

1. Store approved AI documentation/update sources.
2. Manually scan active sources.
3. Store source snapshots and scan history in SQLite.
4. Compare current source content against the previous snapshot.
5. Detect and classify source changes.
6. Summarize meaningful changes into newsletter-ready items.
7. Generate a Markdown and/or HTML newsletter draft.
8. Export the draft for manual review and distribution.

## 4. Portfolio positioning

This project is strong portfolio material because it is not another static CRUD app. It demonstrates:

- Practical AI workflow design.
- Documentation monitoring and change detection.
- Local data persistence with SQLite.
- Controlled source registry design.
- Human-in-the-loop AI summarization.
- Newsletter generation and export.
- Responsible guardrails around AI output.
- Product thinking: signal extraction, noise reduction, and review workflows.

Recommended portfolio framing:

> SignalBrief is a local-first AI documentation monitoring app that converts trusted source changes into reviewable newsletter drafts. It focuses on source control, change detection, and human-reviewed AI summaries rather than uncontrolled scraping or blind automation.

## 5. Recommended stack

| Layer | Recommendation | Purpose |
|---|---|---|
| Framework | Next.js | Local web app with frontend and backend routes in one project |
| UI | React | Interactive source management and review interface |
| Language | TypeScript | Safer app logic and typed records |
| Styling | Tailwind CSS | Fast layout and responsive UI styling |
| Components | shadcn/ui | Tables, forms, dialogs, cards, alerts |
| Database | SQLite | Local persistence for sources, runs, snapshots, changes, newsletters, settings |
| ORM | Prisma | Schema, migrations, and query layer |
| Parsing | Cheerio | Server-side HTML extraction |
| Diffing | jsdiff or diff-match-patch | Text change detection |
| AI summaries | OpenAI, Claude, Ollama, or provider adapter | Source-grounded newsletter summaries |
| Export | Markdown and HTML | Draft reuse and portfolio-friendly output |

## 6. Core architecture

```text
Local browser
    -> Next.js React UI
    -> Next.js Route Handlers / Server Actions
    -> Source fetcher
    -> Content cleaner
    -> SQLite metadata store
    -> Local snapshot file store
    -> Diff engine
    -> Change classifier
    -> AI summarizer
    -> Newsletter builder
    -> Markdown / HTML export
```

## 7. App scope

### In scope for MVP

- Local app running on `localhost`.
- SQLite database.
- Source registry UI.
- Manual scan button.
- Source fetch test.
- Snapshot storage.
- Hash comparison.
- Change detection.
- Run history.
- Newsletter draft generation.
- Markdown export.
- HTML export.
- AI summarization provider interface.
- Human review before use.

### Out of scope for MVP

- Scheduling.
- Automatic email sending.
- User authentication.
- Cloud database.
- Multi-user support.
- Broad web crawling.
- Social media/news scraping.
- Analytics dashboard.
- Browser extension.

## 8. Why SQLite is included

SQLite is required because the app needs memory. Without it, every scan starts from zero and the app cannot determine what changed, what was already summarized, which sources failed, or which newsletters were generated.

SQLite stores structured state:

- Approved sources.
- Manual scan runs.
- Snapshot metadata.
- Detected changes.
- Newsletter items.
- Newsletter drafts.
- Settings.

Large raw content should live in local files, with file paths stored in SQLite. This keeps the database useful without turning it into a landfill for scraped page content.

## 9. Manual scan workflow

```text
User clicks Run Scan
    -> Create Run record in SQLite
    -> Load active sources
    -> Fetch each source server-side
    -> Clean page content
    -> Save raw and cleaned snapshots locally
    -> Hash cleaned content
    -> Compare against previous successful snapshot
    -> Save Snapshot metadata
    -> Create DetectedChange records if content changed
    -> Classify significance
    -> Summarize meaningful changes
    -> Create Newsletter and NewsletterItem records
    -> Generate Markdown draft
    -> Show review page
```

## 10. Recommended app pages

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/` | Run scan, view last run, active sources, failed sources, latest draft |
| Sources | `/sources` | Add, edit, disable, and test approved sources |
| Source Detail | `/sources/[id]` | View source metadata, snapshots, and history |
| Runs | `/runs` | View all manual scan runs |
| Run Detail | `/runs/[id]` | Inspect scan result, source status, changes, errors |
| Newsletter Draft | `/newsletters/[id]` | Review, edit, approve, export newsletter draft |
| Settings | `/settings` | Configure AI provider, model, export folder, summary style |

## 11. System modules

| Module | Responsibility |
|---|---|
| `source-fetcher.ts` | Fetch approved source content server-side |
| `content-cleaner.ts` | Remove nav/footer/noise and normalize text |
| `snapshot-storage.ts` | Write raw and cleaned snapshots to local files |
| `diff-engine.ts` | Compare snapshots and extract changed text |
| `change-classifier.ts` | Classify changes as high, medium, low, or noise |
| `summarizer.ts` | Convert source-backed changes into newsletter items |
| `newsletter-builder.ts` | Generate Markdown and HTML newsletter drafts |
| `exporters.ts` | Save output files locally |
| `validators.ts` | Validate URLs, source records, AI output, and required fields |

## 12. Critical guardrails

- Only scan sources explicitly added to the source registry.
- Never summarize unsupported claims.
- Every newsletter item must include the original source URL.
- AI-generated content must be labeled as draft until reviewed.
- Failed source fetches must be visible.
- Do not auto-send email in the MVP.
- Do not schedule automatic scans until manual runs are reliable.
- Do not allow broad crawling from a root URL.

## 13. Success criteria

The MVP is complete when:

- The SQLite database initializes locally.
- Sources can be added, edited, disabled, and tested.
- Manual scan creates a Run record.
- Active sources are fetched server-side.
- Snapshots are saved locally.
- Snapshot metadata is stored in SQLite.
- Changed vs unchanged sources are visible.
- Detected changes are stored.
- A newsletter draft is generated from meaningful changes.
- The user can export Markdown and HTML.
- No automatic email is sent.

## 14. Readiness assessment

This is a strong project, but the first build should be intentionally narrow. The biggest risk is scope creep: scheduling, email sending, dashboards, hosted deployment, RSS, GitHub releases, and internal docs are all useful later. They should not be allowed to invade the MVP.

The real product is not the newsletter. The real product is the source-controlled change detection pipeline. The newsletter is just the output layer.

## 15. Recommended build order

```text
1. Initialize Next.js app
2. Add SQLite and Prisma
3. Create database schema
4. Build source registry UI
5. Add manual scan action
6. Save snapshots and hashes
7. Compare against previous snapshot
8. Display run history and source status
9. Add diff viewer
10. Generate newsletter draft
11. Add AI summarization
12. Add Markdown and HTML export
```

## 16. Reference links

- Next.js Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js data mutation / Server Actions: https://nextjs.org/docs/app/getting-started/updating-data
- Prisma supported databases: https://www.prisma.io/docs/orm/reference/supported-databases
