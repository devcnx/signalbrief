# SignalBrief

A local-first AI documentation monitoring dashboard that turns trusted source changes into reviewable newsletter drafts.

## Overview

SignalBrief helps users track official AI tool updates without manually checking every changelog, release note page, or documentation hub. It stores approved sources locally, scans them on demand, detects changes against prior snapshots, and generates a source-grounded newsletter draft for review and export.

This project is intentionally designed as a **manual-trigger local web app** first. Scheduling and email delivery are future enhancements.

## Why this project exists

AI platforms change constantly. Important updates are scattered across docs, release notes, API changelogs, and developer portals. SignalBrief focuses on extracting useful signal from trusted sources while avoiding uncontrolled scraping and unsourced AI summaries.

## Current MVP

The MVP supports:

- Local Next.js web app.
- SQLite database.
- Approved source registry.
- Manual scan trigger.
- Source snapshots.
- Hash-based change detection.
- Detected change records.
- Newsletter draft generation.
- Markdown and HTML export.
- Human review before distribution.

## Tech stack

- Next.js
- React
- TypeScript
- SQLite
- Prisma
- Tailwind CSS
- shadcn/ui
- Cheerio
- jsdiff or diff-match-patch
- Optional AI summarization provider

## Architecture

```text
Approved Sources
    -> Manual Scan
    -> Source Fetcher
    -> Content Cleaner
    -> Snapshot Storage
    -> SQLite Metadata
    -> Diff Engine
    -> Change Classifier
    -> AI Summarizer
    -> Newsletter Builder
    -> Markdown / HTML Export
```

## Core concept

SignalBrief is not a generic news scraper. It is a controlled documentation-change detection system with a newsletter output layer.

## Database model

SQLite stores:

- Sources
- Runs
- Snapshots
- Detected changes
- Newsletter items
- Newsletter drafts
- Settings

Large raw and cleaned source content is stored in local files, with file paths referenced in SQLite.

## MVP workflow

1. Add approved AI update sources.
2. Click **Run Scan**.
3. App fetches active sources server-side.
4. App cleans and snapshots source content.
5. App compares current content against previous snapshots.
6. App records meaningful changes.
7. App generates a newsletter draft.
8. User reviews and exports the draft.

## Planned pages

- Dashboard
- Sources
- Source Detail
- Runs
- Run Detail
- Newsletter Draft
- Settings

## Future enhancements

- RSS support
- GitHub release monitoring
- Optional approved email send
- Scheduled scans
- Multi-audience digests
- Hosted deployment option
- PostgreSQL migration for hosted/multi-user version

## Portfolio note

This project demonstrates full-stack product thinking across AI enablement, local persistence, automation design, source governance, and human-in-the-loop AI workflows.

## Status

Planning and implementation packet completed. MVP build in progress.
