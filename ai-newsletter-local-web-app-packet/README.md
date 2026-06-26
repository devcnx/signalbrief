# AI Newsletter Local Web App - Implementation Packet

**Project type:** Local-first web application portfolio project  
**Working title:** SignalBrief  
**Owner/brand fit:** DEVCNX-style systems-first automation and AI enablement project  
**Primary stack:** Next.js, React, TypeScript, SQLite, Prisma, Tailwind, shadcn/ui  
**Trigger model:** Manual run first; scheduling and email delivery are future enhancements

## Packet contents

| File | Purpose |
|---|---|
| `01_IMPLEMENTATION_PACKET.md` | Full project implementation packet and build strategy |
| `02_PRODUCT_REQUIREMENTS.md` | Product requirements, user stories, and acceptance criteria |
| `03_TECHNICAL_ARCHITECTURE.md` | System architecture, app routes, modules, and data flow |
| `04_SQLITE_DATABASE_DESIGN.md` | Local SQLite design, schema rationale, and storage boundaries |
| `05_MVP_BACKLOG_AND_ROADMAP.md` | Build phases, epics, backlog, and future enhancements |
| `06_PROMPT_AND_GUARDRAIL_SPEC.md` | AI summarization prompt, output schema, and safety guardrails |
| `07_TESTING_AND_ACCEPTANCE_CHECKLIST.md` | QA checklist for app behavior, database, scan engine, and newsletter output |
| `08_STARTER_SOURCE_REGISTRY.md` | Starter list of official AI update sources |
| `09_GITHUB_README_DRAFT.md` | Ready-to-adapt GitHub README for the project repository |
| `10_DEVCNX_PORTFOLIO_CASE_STUDY.md` | Portfolio case study copy for devcnx.com |
| `11_SHOWCASE_COPY_SNIPPETS.md` | Short descriptions for GitHub, LinkedIn, resume, and portfolio cards |
| `repo_scaffold/` | Starter schema, prompt, config, and TypeScript interfaces |

## Recommended use

1. Use `09_GITHUB_README_DRAFT.md` as the starting README for the repo.
2. Use `10_DEVCNX_PORTFOLIO_CASE_STUDY.md` as the devcnx.com project page draft.
3. Use `repo_scaffold/prisma/schema.prisma` when starting the Next.js app.
4. Use the backlog and acceptance checklist to track build progress.

## MVP statement

SignalBrief is a local-first AI update monitoring dashboard that lets a user manage approved AI documentation sources, manually scan for source changes, store snapshots in SQLite-backed local history, and generate a source-grounded newsletter draft for review and export.

## What this is not

This is not a broad web crawler, autonomous email spam machine, or generic AI news scraper. It is a controlled documentation-change detection system with a newsletter output layer.
