# Technical Architecture - SignalBrief

## Architecture summary

SignalBrief is a local Next.js application with server-side scan logic and a SQLite persistence layer. It uses React for the UI and TypeScript across the codebase.

## Runtime model

```text
User browser at localhost
    -> React pages/components
    -> Server Actions or Route Handlers
    -> App services in /lib
    -> SQLite through Prisma
    -> Local file system for snapshots and exports
```

## Why server-side scan logic matters

The source fetcher should not run in the browser. Browser-side fetching creates CORS problems, exposes implementation details, and weakens control over source parsing. Fetching belongs in server-side route handlers or server actions.

## App routes

| Route | Purpose |
|---|---|
| `/` | Dashboard and manual scan entry point |
| `/sources` | Source registry list and add action |
| `/sources/[id]` | Source detail, edit, snapshot history |
| `/runs` | Manual scan history |
| `/runs/[id]` | Scan results, failures, changes, newsletter link |
| `/newsletters/[id]` | Draft preview, item approval, export |
| `/settings` | AI provider, model, export preferences |

## API route handlers

| Route | Method | Responsibility |
|---|---:|---|
| `/api/sources` | GET | List sources |
| `/api/sources` | POST | Create source |
| `/api/sources/[id]` | GET | Get source detail |
| `/api/sources/[id]` | PATCH | Update source |
| `/api/sources/[id]` | DELETE | Deactivate source |
| `/api/sources/[id]/test` | POST | Test fetch and cleaning |
| `/api/runs/start` | POST | Start manual scan |
| `/api/runs` | GET | List runs |
| `/api/runs/[id]` | GET | Get run details |
| `/api/newsletters/[id]` | GET | Get newsletter draft |
| `/api/newsletters/[id]` | PATCH | Update draft or approval statuses |
| `/api/newsletters/[id]/export` | POST | Export Markdown or HTML |
| `/api/settings` | GET | Read settings |
| `/api/settings` | PATCH | Update settings |

## Service modules

```text
lib/
├── db.ts
├── source-fetcher.ts
├── content-cleaner.ts
├── snapshot-storage.ts
├── diff-engine.ts
├── change-classifier.ts
├── summarizer.ts
├── newsletter-builder.ts
├── exporters.ts
└── validators.ts
```

## Scan sequence

1. Dashboard sends POST to `/api/runs/start`.
2. Server creates Run with status `running`.
3. Server loads active Source records.
4. Server fetches each source.
5. Content cleaner extracts useful text.
6. Snapshot storage writes raw and cleaned content to files.
7. Hash generator creates content hash.
8. App finds latest prior successful snapshot for the source.
9. Diff engine compares prior/current cleaned content.
10. Change classifier suppresses noise and categorizes meaningful changes.
11. Summarizer creates draft newsletter items.
12. Newsletter builder creates Markdown and HTML bodies.
13. Run is marked complete or complete with errors.
14. User is redirected to the run detail or newsletter draft page.

## File storage boundaries

```text
data/
├── ai-newsletter.sqlite
├── snapshots/
│   └── {sourceId}/
│       ├── {snapshotId}.raw.html
│       └── {snapshotId}.cleaned.txt
├── exports/
│   ├── markdown/
│   └── html/
└── logs/
```

## Database boundaries

SQLite stores metadata and concise structured records. It should not store every raw HTML page unless there is a specific reason to do so.

## Error handling model

The full scan should continue even if one source fails.

| Failure | Behavior |
|---|---|
| Source fetch timeout | Create failed Snapshot, increment run error count |
| Invalid URL | Block source save or mark source invalid |
| Parser failure | Save raw content, mark cleaned content failed |
| AI summarizer failure | Create detected changes, skip AI item generation, flag run |
| Export failure | Keep newsletter draft in SQLite and show error |

## Status values

### Run status

- `pending`
- `running`
- `completed`
- `completed_with_errors`
- `failed`

### Snapshot status

- `success`
- `failed`
- `skipped`

### Newsletter status

- `draft`
- `reviewed`
- `exported`

## Security and privacy notes

- API keys should live in `.env.local` and never be committed.
- The SQLite database should not be committed if it contains real run data.
- Exported newsletters should be reviewed before public use.
- Broad crawling should not be supported in the MVP.
- If hosted later, add authentication, user-level source ownership, and secrets management.
