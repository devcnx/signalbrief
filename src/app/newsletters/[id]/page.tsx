"use client"

import { useCallback, useEffect, useState, use } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { significanceColor } from "@/lib/significance-utils"
import { stripDiffMarkers } from "@/lib/readability"

const DIFF_MARKER_RE = /^(--- removed|\+\+\+ added|- |\+ )/m

function looksLikeRawDiff(text: string): boolean {
  return DIFF_MARKER_RE.test(text)
}

type NewsletterItem = {
  id: string
  title: string
  provider: string
  category: string
  impactLevel: string
  summary: string
  whyItMatters: string
  recommendedAction: string | null
  sourceUrl: string
  confidence: string
  approved: boolean
  source: { name: string; provider: string; url: string }
}

type Newsletter = {
  id: string
  title: string
  status: string
  markdownBody: string
  htmlBody: string | null
  run: { id: string; startedAt: string; completedAt: string | null }
  items: NewsletterItem[]
}

const confidenceColors: Record<string, string> = {
  high: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function NewsletterDraftPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  const fetchNewsletter = useCallback(async () => {
    const res = await fetch(`/api/newsletters/${id}`)
    if (res.ok) {
      const data = await res.json()
      setNewsletter(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchNewsletter()
  }, [fetchNewsletter])

  const toggleApproval = async (itemId: string, current: boolean) => {
    const res = await fetch(`/api/newsletters/${id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !current }),
    })
    if (res.ok) {
      setNewsletter((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, approved: !current } : item
          ),
        }
      })
    }
  }

  const approveAll = async () => {
    if (!newsletter) return
    const res = await fetch(`/api/newsletters/${id}/items/approve-all`, {
      method: "PATCH",
    })
    if (res.ok) {
      setNewsletter((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((item) => ({ ...item, approved: true })),
        }
      })
    }
  }

  const copyMarkdown = async () => {
    if (!newsletter) return
    await navigator.clipboard.writeText(newsletter.markdownBody)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!newsletter) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground">Newsletter not found.</p>
      </div>
    )
  }

  const approvedCount = newsletter.items.filter((i) => i.approved).length

  return (
    <div className="flex-1 p-8">
      <div className="mb-6">
        <Link href="/newsletters" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Newsletters
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold">{newsletter.title}</h1>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>Status: {newsletter.status}</span>
              <span>Items: {newsletter.items.length} ({approvedCount} approved)</span>
              <span>Run: {new Date(newsletter.run.startedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={approveAll}>
              Approve All
            </Button>
            <Button variant="outline" size="sm" onClick={copyMarkdown}>
              {copySuccess ? "Copied!" : "Copy Markdown"}
            </Button>
          </div>
        </div>
      </div>

      {newsletter.items.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No items in this newsletter.
        </div>
      ) : (
        <div className="space-y-4">
          {newsletter.items.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border border-border p-4 ${
                item.approved ? "bg-green-50/50 dark:bg-green-900/10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{item.provider}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-sm text-muted-foreground">{item.category}</span>
                    <Badge className={significanceColor(item.impactLevel)}>
                      {item.impactLevel}
                    </Badge>
                    <Badge className={confidenceColors[item.confidence] || ""}>
                      {item.confidence} confidence
                    </Badge>
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-wrap">
                    {looksLikeRawDiff(item.summary) ? stripDiffMarkers(item.summary) : item.summary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{item.whyItMatters}</p>
                  {item.recommendedAction && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Action: {item.recommendedAction}
                    </p>
                  )}
                  <Link
                    href={item.source.url}
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                    target="_blank"
                  >
                    Source: {item.source.name}
                  </Link>
                </div>
                <Button
                  variant={item.approved ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleApproval(item.id, item.approved)}
                  className="shrink-0"
                >
                  {item.approved ? "Approved" : "Approve"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
