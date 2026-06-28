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
        <div className="p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
            {change.changedText.split("\n").map((line, i) => {
              let className = ""
              if (line.startsWith("--- removed")) {
                className = "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30 -mx-4 px-4 py-0.5 block"
              } else if (line.startsWith("+++ added")) {
                className = "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30 -mx-4 px-4 py-0.5 block"
              } else if (line.startsWith("- ")) {
                className = "text-red-600 -ml-4 pl-4 border-l-2 border-red-400"
              } else if (line.startsWith("+ ")) {
                className = "text-green-600 -ml-4 pl-4 border-l-2 border-green-400"
              }
              return (
                <span key={i} className={className || undefined}>
                  {line}
                </span>
              )
            })}
          </pre>
        </div>
      </div>
    </div>
  )
}
