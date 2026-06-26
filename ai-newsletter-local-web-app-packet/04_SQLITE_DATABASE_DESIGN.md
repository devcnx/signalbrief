# SQLite Database Design - SignalBrief

## Database decision

SignalBrief should use SQLite locally from the beginning. The app needs persistent memory to compare scans, suppress duplicates, preserve history, and generate trustworthy newsletter drafts.

## Recommended database location

```text
data/ai-newsletter.sqlite
```

## Why not just generate an email on trigger?

A stateless trigger cannot reliably answer:

- What changed since the last scan?
- Was this item already included in a prior newsletter?
- Which sources failed last time?
- What did the source look like before?
- Which newsletters were generated historically?
- Which sources are active or disabled?

Without persistent memory, the app becomes a disposable email generator. That sounds simple but immediately breaks the core use case.

## Data storage split

| Data type | Storage location | Reason |
|---|---|---|
| Source records | SQLite | Structured, queryable |
| Scan runs | SQLite | Structured history |
| Snapshot metadata | SQLite | Queryable status and hashes |
| Raw HTML | Local files | Large and noisy |
| Cleaned text | Local files | Used for diffing |
| Detected changes | SQLite | Reviewable structured records |
| Newsletter items | SQLite | Editable and reviewable |
| Newsletter body | SQLite | Convenient draft retrieval |
| Exported files | Local files | Portable output |
| Export paths | SQLite | Link exports to newsletter records |
| Settings | SQLite | Local app preferences |

## Core entities

```text
Source
  -> Snapshot
  -> DetectedChange
  -> NewsletterItem

Run
  -> Snapshot
  -> DetectedChange
  -> Newsletter

Newsletter
  -> NewsletterItem
```

## Prisma schema

See `repo_scaffold/prisma/schema.prisma` for the full starter schema.

## Initial migration plan

1. Create Prisma schema.
2. Configure SQLite datasource.
3. Run initial migration.
4. Seed starter sources.
5. Validate that the app can read/write sources.
6. Add scan records.
7. Add snapshot records.
8. Add newsletter records.

## Recommended Prisma datasource

```prisma
 datasource db {
   provider = "sqlite"
   url      = env("DATABASE_URL")
 }
```

## Recommended `.env.local`

```env
DATABASE_URL="file:./data/ai-newsletter.sqlite"
```

Depending on app structure, the SQLite file path may need adjustment. Keep the database under a local `data/` folder and exclude generated runtime files from commits.

## Tables

### Source

Stores approved update locations.

Important fields:

- `provider`
- `name`
- `url`
- `type`
- `category`
- `priority`
- `active`
- `notes`

### Run

Stores every manual scan event.

Important fields:

- `startedAt`
- `completedAt`
- `status`
- `sourcesChecked`
- `changesFound`
- `errorsCount`

### Snapshot

Stores fetch metadata and paths to source files.

Important fields:

- `sourceId`
- `runId`
- `status`
- `statusCode`
- `contentHash`
- `rawContentPath`
- `cleanedContentPath`
- `errorMessage`

### DetectedChange

Stores meaningful changes discovered during scans.

Important fields:

- `sourceId`
- `runId`
- `snapshotId`
- `changeType`
- `significance`
- `changedText`
- `alreadyIncluded`

### Newsletter

Stores generated newsletter drafts.

Important fields:

- `runId`
- `title`
- `markdownBody`
- `htmlBody`
- `status`
- `exportPathMd`
- `exportPathHtml`

### NewsletterItem

Stores individual summarized update items.

Important fields:

- `newsletterId`
- `sourceId`
- `detectedChangeId`
- `title`
- `summary`
- `whyItMatters`
- `recommendedAction`
- `sourceUrl`
- `confidence`
- `approved`

### Setting

Stores local app settings.

Important fields:

- `key`
- `value`

## Indexing recommendations

Add indexes for common queries:

- `Source.active`
- `Snapshot.sourceId`
- `Snapshot.runId`
- `Snapshot.contentHash`
- `DetectedChange.runId`
- `DetectedChange.sourceId`
- `Newsletter.runId`
- `NewsletterItem.newsletterId`

## Git hygiene

Commit:

- `prisma/schema.prisma`
- migration files
- seed scripts
- example source config
- README instructions

Do not commit:

- real `.env.local`
- generated SQLite database with personal/private content
- raw snapshots from real source runs unless intentionally used as sanitized sample data
- API keys
- exported newsletters containing private notes

## Future migration path

If the app becomes hosted or multi-user, migrate from SQLite to PostgreSQL. Keep the data access layer behind Prisma so the migration is less painful.
