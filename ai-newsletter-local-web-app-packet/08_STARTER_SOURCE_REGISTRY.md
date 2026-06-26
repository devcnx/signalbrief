# Starter Source Registry - SignalBrief

## Purpose

The source registry defines the approved AI update locations the app is allowed to scan. The MVP should only scan sources explicitly listed and activated by the user.

## Starter sources

| Provider | Name | URL | Type | Category | Priority |
|---|---|---|---|---|---|
| OpenAI | OpenAI API Changelog | https://platform.openai.com/docs/changelog | changelog | api | high |
| Anthropic | Claude Release Notes | https://docs.anthropic.com/en/release-notes/overview | release_notes | platform | high |
| Google | Gemini API Release Notes | https://ai.google.dev/gemini-api/docs/changelog | release_notes | api | high |
| Microsoft | Microsoft Foundry What's New | https://learn.microsoft.com/en-us/azure/foundry/whats-new-foundry | docs_page | enterprise_ai | medium |

## Recommended source fields

```ts
type SourceSeed = {
  provider: string
  name: string
  url: string
  type: 'docs_page' | 'changelog' | 'release_notes' | 'rss' | 'github_release'
  category: string
  priority: 'high' | 'medium' | 'low'
  active: boolean
  notes?: string
}
```

## Starter seed file

See `repo_scaffold/config/starter-sources.ts`.

## Source quality rules

Add a source only if:

- It is official or intentionally approved.
- It has recurring update value.
- It can be fetched reliably.
- It produces useful change information.
- It does not require broad crawling.

Avoid sources that are:

- Marketing-heavy with little technical signal.
- Private pages requiring complex auth.
- Dynamic pages that require full browser automation.
- Duplicates of existing source data.
- Too broad to summarize meaningfully.

## Future source types

| Source type | Future handling |
|---|---|
| RSS | Parse feed entries and compare entry IDs/dates |
| GitHub releases | Use GitHub API or releases Atom feed |
| GitHub changelog files | Fetch raw markdown and diff it |
| Internal docs | Require authentication and careful access handling |
| Vendor blogs | Prefer RSS; avoid scraping marketing pages unless curated |
