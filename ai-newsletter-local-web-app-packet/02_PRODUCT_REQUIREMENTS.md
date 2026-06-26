# Product Requirements Document - SignalBrief

## Product summary

SignalBrief is a local-first AI newsletter dashboard that monitors approved AI update sources and generates source-grounded newsletter drafts from detected documentation changes.

## Target users

Primary user:

- Individual developer, AI enablement specialist, analyst, or technical project owner who wants to track AI documentation changes without manually checking every source.

Secondary users later:

- Internal AI Champions.
- Developer enablement teams.
- Governance and risk reviewers.
- Freelance consultants managing AI update reports for clients.

## Core problem

AI platforms change quickly. Important updates are scattered across documentation pages, release notes, changelogs, provider blogs, and developer portals. Manually checking these sources is time-consuming, repetitive, and easy to forget.

The app should reduce that manual burden while preserving source traceability and user review.

## Product goals

| Goal | Description |
|---|---|
| Source control | Only monitor explicitly approved sources |
| Local persistence | Store source history and run data locally using SQLite |
| Manual control | User decides when scans run |
| Change detection | Identify what changed since the previous successful scan |
| Signal extraction | Separate meaningful updates from page noise |
| Reviewable output | Generate draft newsletters, not automatic sends |
| Portfolio value | Demonstrate full-stack, AI, automation, and data design skills |

## MVP user stories

| ID | User story | Priority |
|---|---|---|
| US-01 | As a user, I can add an approved AI update source so the app knows what to monitor. | High |
| US-02 | As a user, I can edit or disable a source without deleting its history. | High |
| US-03 | As a user, I can manually trigger a scan from the dashboard. | High |
| US-04 | As a user, I can see which sources changed, failed, or stayed the same. | High |
| US-05 | As a user, I can view detected changes from a scan. | High |
| US-06 | As a user, I can generate a newsletter draft from meaningful changes. | High |
| US-07 | As a user, I can review source links before using newsletter content. | High |
| US-08 | As a user, I can export a Markdown newsletter draft. | High |
| US-09 | As a user, I can export an HTML newsletter draft. | Medium |
| US-10 | As a user, I can configure an AI provider and model. | Medium |
| US-11 | As a user, I can view previous runs and newsletters. | Medium |
| US-12 | As a user, I can reset a source's snapshot history if needed. | Low |

## Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | The app shall store approved sources in SQLite. |
| FR-02 | The app shall support source fields for provider, name, URL, type, category, priority, active status, and notes. |
| FR-03 | The app shall allow users to manually trigger a scan. |
| FR-04 | The app shall create a Run record for each manual scan. |
| FR-05 | The app shall fetch active sources server-side. |
| FR-06 | The app shall store raw and cleaned source snapshot files locally. |
| FR-07 | The app shall store snapshot metadata in SQLite. |
| FR-08 | The app shall compare current content hash against the latest prior successful snapshot. |
| FR-09 | The app shall create DetectedChange records when changed content is found. |
| FR-10 | The app shall classify changes by significance. |
| FR-11 | The app shall generate newsletter items from meaningful changes. |
| FR-12 | The app shall include source URLs for every newsletter item. |
| FR-13 | The app shall allow the user to review the generated newsletter draft. |
| FR-14 | The app shall export the newsletter as Markdown. |
| FR-15 | The app shall export the newsletter as HTML. |

## Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 | The app shall run locally on the user's machine. |
| NFR-02 | The app shall use SQLite for local persistence. |
| NFR-03 | The app shall not require cloud hosting for the MVP. |
| NFR-04 | The app shall not automatically send emails in the MVP. |
| NFR-05 | The app shall not scan unapproved sources. |
| NFR-06 | The app shall handle failed source fetches without failing the full run. |
| NFR-07 | The app shall preserve historical scan records. |
| NFR-08 | The app shall separate large snapshot files from structured database records. |
| NFR-09 | The app shall be readable and maintainable as a portfolio project. |

## MVP acceptance criteria

- User can create and manage sources.
- User can run a manual scan.
- User can view run status.
- User can view changed and unchanged sources.
- User can view failed source checks.
- User can generate a newsletter draft.
- User can export Markdown.
- SQLite stores source, run, snapshot, change, and newsletter metadata.
- Raw source snapshots are saved to local files.
- The app does not send email automatically.

## Future enhancements

- Optional email sending after manual approval.
- Scheduling.
- RSS support.
- GitHub releases support.
- Source health dashboard.
- Multi-audience newsletter variants.
- Hosted version with authentication.
- Client workspace mode for freelance use.
