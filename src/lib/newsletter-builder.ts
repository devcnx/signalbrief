import { prisma } from "./db"
import type { Significance } from "./types"

const SIGNIFICANCE_TO_IMPACT: Record<Significance, string> = {
  high: "high",
  medium: "medium",
  low: "low",
  noise: "low",
}

function escapeMarkdown(text: string): string {
  return text.replace(/([*_`#\[！])/g, "\\$1")
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

function buildMarkdown(
  title: string,
  items: Array<{
    provider: string
    sourceName: string
    summary: string
    sourceUrl: string
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
      lines.push(item.summary)
      lines.push("")
      lines.push(`[Source](${item.sourceUrl})`)
      lines.push("")
    }
  }

  return lines.join("\n")
}

function buildHtml(markdown: string): string {
  const lines = markdown.split("\n")
  const htmlLines: string[] = []
  htmlLines.push("<!DOCTYPE html>")
  htmlLines.push('<html lang="en">')
  htmlLines.push("<head>")
  htmlLines.push('<meta charset="UTF-8">')
  htmlLines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  htmlLines.push("<style>")
  htmlLines.push("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 2rem; color: #1a1a1a; line-height: 1.6; }")
  htmlLines.push("h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }")
  htmlLines.push("h2 { color: #374151; margin-top: 2rem; }")
  htmlLines.push("h3 { color: #1f2937; }")
  htmlLines.push("a { color: #2563eb; }")
  htmlLines.push("hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }")
  htmlLines.push("</style>")
  htmlLines.push("</head>")
  htmlLines.push("<body>")

  let inList = false
  for (const line of lines) {
    if (line.startsWith("# ")) {
      htmlLines.push(`<h1>${escapeHtml(line.slice(2))}</h1>`)
    } else if (line.startsWith("## ")) {
      htmlLines.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
    } else if (line.startsWith("### ")) {
      htmlLines.push(`<h3>${escapeHtml(line.slice(4))}</h3>`)
    } else if (line.startsWith("[") && line.includes("](")) {
      const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (match) {
        htmlLines.push(`<p><a href="${escapeHtml(match[2])}">${escapeHtml(match[1])}</a></p>`)
      }
    } else if (line.startsWith("*") && line.endsWith("*")) {
      htmlLines.push(`<p><em>${escapeHtml(line.slice(1, -1))}</em></p>`)
    } else if (line.trim() === "") {
      htmlLines.push("")
    } else {
      htmlLines.push(`<p>${escapeHtml(line)}</p>`)
    }
  }

  htmlLines.push("</body>")
  htmlLines.push("</html>")
  return htmlLines.join("\n")
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function buildNewsletter(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      changes: {
        include: {
          source: { select: { name: true, provider: true } },
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
    title: truncate(change.changedText, 80),
    provider: change.source.provider,
    category: change.source.name,
    sourceName: change.source.name,
    impactLevel: SIGNIFICANCE_TO_IMPACT[change.significance as Significance] || "low",
    summary: change.changedText,
    whyItMatters: "Detected change requires review.",
    sourceUrl: `https://signalbrief.local/change/${change.id}`,
    confidence: "low" as const,
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
