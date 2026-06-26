# MVP Backlog and Roadmap - SignalBrief

## MVP build principle

Build the smallest useful local app first:

```text
Sources -> Manual Scan -> Snapshots -> Change Detection -> Newsletter Draft -> Export
```

Do not add scheduling or automatic email sending until the app consistently produces useful, source-grounded drafts.

## Phase 1 - App foundation and SQLite

### Goal

Create the local Next.js application foundation and connect it to SQLite.

### Tasks

- Initialize Next.js app with TypeScript.
- Add Tailwind CSS.
- Add shadcn/ui.
- Install Prisma.
- Configure SQLite datasource.
- Create initial Prisma schema.
- Create local `data/` directory.
- Add seed script for starter sources.
- Create base layout and navigation.

### Acceptance criteria

- App runs locally.
- SQLite database initializes.
- Prisma client can query the database.
- Dashboard route loads.

## Phase 2 - Source registry

### Goal

Let the user manage approved AI update sources.

### Tasks

- Build Sources page.
- Add source table.
- Add source form.
- Add edit source flow.
- Add active/inactive toggle.
- Add source delete/deactivate behavior.
- Add source validation.
- Add test fetch button.

### Acceptance criteria

- User can add a source.
- User can edit a source.
- User can disable a source.
- User can test a source fetch.
- Sources persist in SQLite.

## Phase 3 - Manual scan engine

### Goal

Let the user manually scan active sources.

### Tasks

- Add Run Scan button.
- Create `/api/runs/start` route.
- Create Run record.
- Load active sources.
- Fetch source content server-side.
- Save raw content to local file.
- Clean content and save cleaned file.
- Create Snapshot records.
- Track source success/failure.

### Acceptance criteria

- Clicking Run Scan creates a Run.
- Active sources are fetched.
- Snapshots are written to local files.
- Snapshot metadata is saved in SQLite.
- Failed sources are visible.

## Phase 4 - Hash comparison and diffing

### Goal

Detect changed vs unchanged sources.

### Tasks

- Generate hash from cleaned content.
- Look up latest prior successful snapshot.
- Compare current hash to previous hash.
- Mark unchanged sources.
- Generate text diff for changed sources.
- Store DetectedChange records.
- Add Run Detail page.
- Add raw diff viewer.

### Acceptance criteria

- App can identify unchanged sources.
- App can identify changed sources.
- App stores detected changes.
- User can view scan results.

## Phase 5 - Newsletter draft generation

### Goal

Generate a newsletter draft from detected changes.

### Tasks

- Create newsletter Markdown template.
- Group updates by impact/category.
- Create Newsletter record.
- Create NewsletterItem records.
- Build Newsletter Draft page.
- Add preview mode.
- Add copy-to-clipboard.

### Acceptance criteria

- App generates a newsletter draft after a scan.
- Newsletter includes sources checked.
- Newsletter links each update to its source.
- User can review draft content.

## Phase 6 - AI summarization

### Goal

Convert raw changes into readable, source-grounded newsletter items.

### Tasks

- Create summarizer interface.
- Add provider adapter for selected model/API.
- Add no-AI fallback summarizer.
- Add summarization prompt.
- Validate JSON output.
- Add confidence score.
- Add approval checkbox per item.

### Acceptance criteria

- App can summarize detected changes.
- Summary output follows a structured schema.
- Every item includes source URL.
- Low-confidence output is flagged.

## Phase 7 - Export

### Goal

Allow users to export drafts.

### Tasks

- Export Markdown file.
- Export HTML file.
- Store export paths in SQLite.
- Add export buttons.
- Add export success/failure feedback.

### Acceptance criteria

- User can export `.md`.
- User can export `.html`.
- Export paths are stored in SQLite.

## Deferred features

| Feature | Reason deferred |
|---|---|
| Automatic email sending | Draft quality must be proven first |
| Scheduling | Manual trigger is the stated initial requirement |
| Authentication | Local-only app does not need it |
| Cloud deployment | Adds complexity before MVP validation |
| Multi-user support | Out of scope for local portfolio build |
| Dashboard analytics | Not required for first useful version |
| Broad crawling | High noise and governance risk |

## Future roadmap

### Version 1.1

- RSS feed support.
- GitHub releases support.
- Better significance classifier.
- Newsletter editing UX.
- Reset source history.

### Version 1.2

- Optional manual email send after approval.
- Saved recipient lists.
- Newsletter templates.
- Audience-specific summaries.

### Version 2.0

- Scheduled scans.
- Hosted deployment option.
- User authentication.
- PostgreSQL migration.
- Client workspace mode.
- Source health analytics.

## Portfolio milestone checklist

- [ ] Create GitHub repository.
- [ ] Commit schema and seed sources.
- [ ] Build source registry UI.
- [ ] Build manual scan.
- [ ] Add screenshots to README.
- [ ] Add architecture diagram.
- [ ] Add sample newsletter output.
- [ ] Publish devcnx.com case study.
- [ ] Add project to resume/LinkedIn portfolio section.
