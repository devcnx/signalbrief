import { prisma } from "./db"
import { marked } from "marked"
import sanitizeHtml from "sanitize-html"
import type { Significance } from "./types"
import { buildReadableTitle, buildReadableSummary } from "./readability"

const SIGNIFICANCE_TO_IMPACT: Record<Significance, string> = {
  high: "high",
  medium: "medium",
  low: "low",
  noise: "low",
}

const WHY_IT_MATTERS: Record<string, Record<string, string>> = {
  high: {
    new: "New high-impact content — requires immediate review.",
    updated: "Significant update detected — review recommended.",
    removed: "High-impact content removed — verify intentionality.",
  },
  medium: {
    new: "New content detected — worth reviewing.",
    updated: "Moderate change detected — review when convenient.",
    removed: "Content removed — check for breaking changes.",
  },
  low: {
    new: "Minor addition detected — likely low impact.",
    updated: "Minor update detected — probably low impact.",
    removed: "Minor content removed — unlikely to affect workflows.",
  },
}

export function getWhyItMatters(significance: string, changeType: string): string {
  return WHY_IT_MATTERS[significance]?.[changeType] ?? "Change detected — review to assess impact."
}

export function escapeMarkdown(text: string): string {
  return text.replace(/([*_`#\[\]])/g, "\\$1")
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

export function buildMarkdown(
  title: string,
  items: Array<{
    provider: string
    sourceName: string
    sourceUrl: string | null
    summary: string
    impactLevel: string
    approved: boolean
  }>
): string {
  const lines: string[] = []
  lines.push(`# ${title}`)
  lines.push("")
  lines.push(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push("")

  const approved = items.filter((i) => i.approved)
  if (approved.length === 0) {
    lines.push("*No items approved yet. Review and approve items in the draft view.*")
    lines.push("")
    return lines.join("\n")
  }

  const byImpact = {
    high: approved.filter((i) => i.impactLevel === "high"),
    medium: approved.filter((i) => i.impactLevel === "medium"),
    low: approved.filter((i) => i.impactLevel === "low"),
  }

  const sections: Array<{ label: string; items: typeof approved }> = [
    { label: "High Impact", items: byImpact.high },
    { label: "Medium Impact", items: byImpact.medium },
    { label: "Low Impact", items: byImpact.low },
  ]

  for (const section of sections) {
    if (section.items.length === 0) continue
    lines.push(`## ${section.label}`)
    lines.push("")
    for (const item of section.items) {
      lines.push(`### ${escapeMarkdown(item.provider)} — ${escapeMarkdown(item.sourceName)}`)
      lines.push("")
      lines.push(escapeMarkdown(item.summary))
      lines.push("")
      lines.push(item.sourceUrl ? `[Source](${item.sourceUrl})` : `Source: ${escapeMarkdown(item.sourceName)}`)
      lines.push("")
    }
  }

  return lines.join("\n")
}

export function buildHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown) as string
  const body = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "title", "target", "rel"],
    },
  })
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 2rem; color: #1a1a1a; line-height: 1.6; }
h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
h2 { color: #374151; margin-top: 2rem; }
h3 { color: #1f2937; }
a { color: #2563eb; }
hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
</style>
</head>
<body>
${body}
</body>
</html>`
}

export async function buildNewsletter(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      changes: {
        include: {
          source: { select: { name: true, provider: true, url: true } },
        },
        where: { significance: { not: "noise" } },
      },
    },
  })

  if (!run) throw new Error(`Run not found: ${runId}`)
  if (run.changes.length === 0) return null

  const existing = await prisma.newsletter.findUnique({ where: { runId } })
  if (existing) return existing

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const title = `AI Documentation Update — ${dateStr}`

  const items = run.changes.map((change) => ({
    sourceId: change.sourceId,
    detectedChangeId: change.id,
    title: buildReadableTitle(change.changedText, change.source.name),
    provider: change.source.provider,
    category: change.source.name,
    sourceName: change.source.name,
    impactLevel: SIGNIFICANCE_TO_IMPACT[change.significance as Significance] || "low",
    summary: buildReadableSummary(change.changedText),
    whyItMatters: getWhyItMatters(change.significance, change.changeType),
    sourceUrl: change.source.url,
    confidence: (change.significance === "high" || change.significance === "medium") ? "high" : "low" as const,
    approved: false,
  }))

  const markdown = buildMarkdown(title, items)
  const html = buildHtml(markdown)

  const newsletter = await prisma.newsletter.create({
    data: {
      runId,
      title,
      markdownBody: markdown,
      htmlBody: html,
      status: "draft",
      items: {
        create: items,
      },
    },
    include: { items: true },
  })

  return newsletter
}
