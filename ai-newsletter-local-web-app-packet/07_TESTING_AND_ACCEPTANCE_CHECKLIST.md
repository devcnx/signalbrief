# Testing and Acceptance Checklist - SignalBrief

## App foundation

- [ ] App starts locally without errors.
- [ ] Dashboard loads at `/`.
- [ ] Navigation links work.
- [ ] Environment variables load correctly.
- [ ] SQLite database file is created.
- [ ] Prisma client can connect to SQLite.

## Source registry

- [ ] User can add a source.
- [ ] User can edit a source.
- [ ] User can disable a source.
- [ ] User can reactivate a source.
- [ ] URL validation blocks invalid URLs.
- [ ] Duplicate source URLs are prevented.
- [ ] Test fetch returns success for reachable pages.
- [ ] Test fetch returns readable error for failed pages.

## Manual scan

- [ ] Run Scan button creates a Run record.
- [ ] Run status changes to `running`.
- [ ] Active sources are loaded.
- [ ] Disabled sources are skipped.
- [ ] Each source creates a Snapshot record.
- [ ] Raw content file is saved locally.
- [ ] Cleaned content file is saved locally.
- [ ] Run completes if all sources succeed.
- [ ] Run completes with errors if one or more sources fail.
- [ ] Full run does not fail because a single source fails.

## Snapshot and hash behavior

- [ ] First successful scan creates baseline snapshots.
- [ ] Re-running without page changes marks source unchanged.
- [ ] Changed content creates a new DetectedChange record.
- [ ] Content hash is stored.
- [ ] Latest prior successful snapshot is used for comparison.
- [ ] Failed snapshots are not used as baseline.

## Diff and classification

- [ ] Diff viewer shows changed text.
- [ ] Navigation/footer noise is minimized.
- [ ] Date-only changes can be classified as low/noise.
- [ ] Meaningful changes are classified as low/medium/high.
- [ ] Detected changes are linked to source, run, and snapshot.

## Newsletter generation

- [ ] Newsletter record is created after meaningful changes.
- [ ] Newsletter items are created from detected changes.
- [ ] Newsletter includes generated date.
- [ ] Newsletter includes source links.
- [ ] Newsletter includes sources checked table.
- [ ] Newsletter includes failed sources section if applicable.
- [ ] User can preview Markdown.
- [ ] User can preview HTML if implemented.
- [ ] User can approve/reject individual items.

## AI summarization

- [ ] App works when AI provider is not configured.
- [ ] App can call configured summarizer provider.
- [ ] AI output is validated as JSON.
- [ ] Malformed AI output is rejected or routed to fallback.
- [ ] Low-confidence summaries are flagged.
- [ ] Summary does not omit source URL.
- [ ] Summary does not invent unsupported claims.

## Export

- [ ] User can export Markdown.
- [ ] User can export HTML.
- [ ] Exported files are saved under `data/exports/`.
- [ ] Export paths are stored in SQLite.
- [ ] Export failure does not delete newsletter draft.

## Portfolio readiness

- [ ] README explains problem, architecture, stack, and screenshots.
- [ ] README includes local setup instructions.
- [ ] README includes sample source registry.
- [ ] README includes sample newsletter output.
- [ ] App has clean screenshots for dashboard, source registry, run detail, and newsletter draft.
- [ ] Devcnx.com case study explains problem, approach, build, and results.
- [ ] Repository excludes secrets and local runtime files.

## Regression checks

- [ ] Adding a source does not break scan.
- [ ] Disabling a source removes it from future scans.
- [ ] Repeated scans do not duplicate already included items.
- [ ] Failed source fetches remain visible historically.
- [ ] Old newsletters remain accessible.
- [ ] Exporting does not mutate approved item state unexpectedly.
