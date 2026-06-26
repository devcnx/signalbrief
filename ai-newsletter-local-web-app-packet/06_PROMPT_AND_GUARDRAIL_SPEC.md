# Prompt and Guardrail Specification - SignalBrief

## Purpose

The summarizer should convert detected source changes into clear newsletter-ready updates without inventing unsupported claims.

## Core summarization rule

Summarize only what is present in the provided source excerpt. Do not infer vendor intent, future roadmap, pricing impact, security impact, or business impact unless explicitly labeled as an inference.

## Summarizer input

The summarizer receives:

```json
{
  "provider": "OpenAI",
  "sourceName": "OpenAI API Changelog",
  "sourceUrl": "https://platform.openai.com/docs/changelog",
  "category": "api",
  "priority": "high",
  "changedText": "...",
  "previousContext": "optional previous text",
  "audience": ["builders", "ai_enablement"]
}
```

## Required summarizer output

```json
{
  "title": "Short title for the update",
  "provider": "Provider name",
  "category": "api | platform | model | governance | developer_tools | other",
  "impactLevel": "high | medium | low",
  "summary": "One to three sentence factual summary.",
  "whyItMatters": "Practical implication, clearly grounded or labeled as inference.",
  "recommendedAction": "Optional action for the reader.",
  "sourceUrl": "Original source URL",
  "confidence": "high | medium | low",
  "needsReview": true
}
```

## Prompt template

```text
You are summarizing official AI documentation changes for a newsletter draft.

Rules:
- Use only the source excerpt provided.
- Do not invent details.
- Do not claim business, cost, compliance, or security impact unless directly supported.
- If an implication is reasonable but not directly stated, label it as an inference.
- Keep the summary useful to technical and AI enablement readers.
- Every output must include the original source URL.
- If the change is trivial, classify the impact as low and explain why.
- If the excerpt is too unclear, set confidence to low and needsReview to true.

Source metadata:
Provider: {{provider}}
Source name: {{sourceName}}
Source URL: {{sourceUrl}}
Category: {{category}}
Priority: {{priority}}
Audience: {{audience}}

Changed source text:
{{changedText}}

Return valid JSON only using this schema:
{
  "title": string,
  "provider": string,
  "category": string,
  "impactLevel": "high" | "medium" | "low",
  "summary": string,
  "whyItMatters": string,
  "recommendedAction": string | null,
  "sourceUrl": string,
  "confidence": "high" | "medium" | "low",
  "needsReview": boolean
}
```

## Change significance rules

### High impact

Use when the source change includes:

- New model or major capability.
- API deprecation or breaking change.
- Security, privacy, or compliance-relevant change.
- Pricing, limits, or availability change.
- Enterprise feature with broad adoption impact.

### Medium impact

Use when the source change includes:

- SDK update with developer relevance.
- Documentation section added for an existing feature.
- Preview capability.
- Model behavior clarification.
- Integration guidance.

### Low impact

Use when the source change includes:

- Minor documentation addition.
- Small feature clarification.
- Non-breaking improvement.

### Noise

Suppress or flag when change appears to be:

- Footer/navigation update.
- Date-only update.
- Formatting-only change.
- Broken scrape artifact.
- Marketing copy with no actionable product change.

## Guardrails

| Guardrail | Enforcement |
|---|---|
| Approved sources only | Fetcher reads only active Source records |
| Source traceability | NewsletterItem requires `sourceUrl` |
| Human review | `needsReview` defaults to true |
| Confidence scoring | AI output must include confidence |
| JSON validation | Reject malformed summarizer output |
| Duplicate suppression | Do not summarize already included changes |
| Low-confidence routing | Flag low-confidence items in review UI |
| No auto-send | MVP only exports drafts |

## Validation checklist for AI output

- [ ] Output is valid JSON.
- [ ] Source URL is present.
- [ ] Summary is grounded in changed text.
- [ ] Inferences are labeled.
- [ ] No unsupported claims about cost/security/compliance.
- [ ] Impact level is reasonable.
- [ ] Confidence is included.
- [ ] Needs review is included.

## No-AI fallback

If no AI provider is configured, the app should still generate a basic newsletter shell with raw detected changes:

```markdown
### {{provider}} - {{sourceName}}

**Detected change:**
{{changedTextExcerpt}}

**Source:** {{sourceUrl}}

**Review required:** Yes
```

This keeps the app functional without requiring an API key.
