import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { significanceColor } from "@/lib/significance-utils"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function DiffViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; snapshotId: string }>
  searchParams: Promise<{ changeId?: string }>
}) {
  const { id, snapshotId } = await params
  const { changeId } = await searchParams

  if (!changeId) {
    return (
      <div className="flex-1 p-8">
        <div className="mb-6">
          <Link href={`/runs/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Run Detail
          </Link>
          <h1 className="text-3xl font-bold mt-2">Diff View</h1>
        </div>
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No change specified. Select a change from the run detail page.
        </div>
      </div>
    )
  }

  const snapshot = await prisma.snapshot.findUnique({
    where: { id: snapshotId },
    include: {
      source: {
        select: { id: true, name: true, provider: true, url: true },
      },
      changes: {
        where: { id: changeId },
      },
    },
  })

  if (!snapshot || snapshot.changes.length === 0) {
    notFound()
  }

  const change = snapshot.changes[0]

  return (
    <div className="flex-1 p-8">
      <div className="mb-6">
        <Link href={`/runs/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Run Detail
        </Link>
        <h1 className="text-3xl font-bold mt-2">Diff View</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm">
            Source:{" "}
            <Link href={snapshot.source.url} className="text-primary hover:underline" target="_blank">
              {snapshot.source.name}
            </Link>
          </span>
          <span className="text-xs text-muted-foreground">{snapshot.source.provider}</span>
          <Badge className={significanceColor(change.significance)}>
            {change.significance}
          </Badge>
          <Badge variant="outline">{change.changeType}</Badge>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-2 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Fetched at: {new Date(snapshot.fetchedAt).toLocaleString()}
          </p>
        </div>
        <div className="p-4 space-y-4">
          {(() => {
            const lines = change.changedText.split("\n")
            const sections: Array<{ type: "removed" | "added"; lines: string[] }> = []
            let current: { type: "removed" | "added"; lines: string[] } | null = null
            for (const line of lines) {
              if (line === "--- removed") {
                current = { type: "removed", lines: [] }
                sections.push(current)
              } else if (line === "+++ added") {
                current = { type: "added", lines: [] }
                sections.push(current)
              } else if (current && line.trim().length > 0) {
                current.lines.push(line)
              }
            }

            if (sections.length === 0) {
              return (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {change.changedText}
                </p>
              )
            }

            return sections.map((section, i) => (
              <div key={i}>
                <div
                  className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    section.type === "removed"
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {section.type === "removed" ? "Removed" : "Added"}
                </div>
                <div className="rounded-md border border-border overflow-hidden">
                  {section.lines.map((line, j) => {
                    const isRemoved = section.type === "removed"
                    const content = line.replace(/^[-+] /, "")
                    return (
                      <div
                        key={j}
                        className={`px-3 py-1 text-sm font-mono whitespace-pre-wrap leading-relaxed ${
                          isRemoved
                            ? "bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                            : "bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                        } ${j > 0 ? "border-t border-border/40" : ""}`}
                      >
                        {content}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
