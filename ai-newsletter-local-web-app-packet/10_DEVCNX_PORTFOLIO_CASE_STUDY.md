# SignalBrief - Portfolio Case Study Draft

## Project title

SignalBrief: Local AI Documentation Monitoring and Newsletter Drafting App

## Short description

SignalBrief is a local-first web application that monitors approved AI documentation sources, detects meaningful changes, and generates source-grounded newsletter drafts for review and export.

## Project type

- Full-stack web application
- AI workflow automation
- Local data persistence
- Documentation monitoring
- Newsletter generation system

## Problem

AI platforms release frequent updates across scattered documentation pages, API changelogs, release notes, and developer portals. Manually checking each source is repetitive and easy to miss. Generic AI news feeds create a different problem: too much noise, too little source control.

SignalBrief was designed to solve a specific version of that problem:

> Track trusted AI documentation sources, identify what changed, and convert those changes into a useful draft newsletter without losing source traceability.

## Solution

I designed a local web app that lets a user maintain an approved registry of AI update sources, manually trigger source scans, compare source snapshots, and generate reviewable newsletter drafts.

The system uses SQLite for local memory so it can track source history, prior snapshots, scan runs, detected changes, and generated drafts.

## Key features

- Approved source registry.
- Manual scan trigger.
- Local SQLite database.
- Source snapshot history.
- Change detection against previous scans.
- Meaningful update classification.
- AI-assisted summarization with source guardrails.
- Newsletter draft preview.
- Markdown and HTML export.
- Human review before distribution.

## Technical approach

```text
Next.js / React UI
    -> Server-side scan route
    -> Source fetcher
    -> Content cleaner
    -> SQLite metadata store
    -> Local snapshot files
    -> Diff engine
    -> AI summarizer
    -> Newsletter builder
    -> Markdown / HTML export
```

## Stack

- Next.js
- React
- TypeScript
- SQLite
- Prisma
- Tailwind CSS
- shadcn/ui
- Cheerio
- Diffing library
- Optional AI provider integration

## Why local-first?

The first version is intentionally local-first. This keeps the MVP focused on the core engine: source control, scan history, change detection, and draft generation. Scheduling, hosted deployment, and automated email sending are deferred until the manual workflow is reliable.

## Design principle

SignalBrief is built around one product rule:

> Do not automate distribution until the content can be trusted.

That is why the MVP generates reviewable drafts instead of sending automatic emails.

## What makes it different

Most newsletter automation ideas start with delivery. SignalBrief starts with memory and signal quality.

The database matters because the app needs to know:

- Which sources are approved.
- When they were last checked.
- What content changed.
- Which updates were already included.
- Which summaries need review.
- Which drafts were generated.

## Outcome

The planned MVP creates a repeatable workflow for transforming trusted AI documentation changes into structured newsletter drafts. It demonstrates full-stack engineering, product design, automation architecture, and responsible AI summarization.

## Future enhancements

- Optional approved email send.
- Scheduled scans.
- RSS and GitHub release monitoring.
- Multi-audience newsletter variants.
- Hosted version with authentication.
- Client workspace mode for consulting use.

## Portfolio tags

`Next.js` `React` `TypeScript` `SQLite` `Prisma` `AI Automation` `Local-First App` `Newsletter Automation` `Documentation Monitoring` `Change Detection`
