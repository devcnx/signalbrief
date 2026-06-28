import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { significanceColor } from "@/lib/significance-utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

const statusColors: Record<string, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  skipped: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      snapshots: {
        include: {
          source: {
            select: { id: true, name: true, provider: true, url: true },
          },
        },
        orderBy: { fetchedAt: "desc" },
      },
      changes: {
        include: {
          source: {
            select: { id: true, name: true, provider: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!run) {
    notFound()
  }

  const successCount = run.snapshots.filter((s) => s.status === "success").length
  const failedCount = run.snapshots.filter((s) => s.status === "failed").length
  const changesBySnapshot = new Map<string, typeof run.changes>()
  for (const change of run.changes) {
    const existing = changesBySnapshot.get(change.snapshotId)
    if (existing) {
      existing.push(change)
    } else {
      changesBySnapshot.set(change.snapshotId, [change])
    }
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-6">
        <Link href="/runs" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Runs
        </Link>
        <h1 className="text-3xl font-bold mt-2">Run Detail</h1>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span>Started: {new Date(run.startedAt).toLocaleString()}</span>
          <span>Completed: {run.completedAt ? new Date(run.completedAt).toLocaleString() : "—"}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-lg font-semibold mt-1">{run.status.replace(/_/g, " ")}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Sources Checked</p>
          <p className="text-lg font-semibold mt-1">{run.sourcesChecked}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Succeeded</p>
          <p className="text-lg font-semibold mt-1 text-green-600">{successCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Changes</p>
          <p className="text-lg font-semibold mt-1 text-amber-600">{run.changesFound}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-lg font-semibold mt-1 text-red-600">{failedCount}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Snapshots</h2>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>HTTP Code</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {run.snapshots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No snapshots for this run.
                </TableCell>
              </TableRow>
            ) : (
              run.snapshots.map((snapshot) => {
                const snapshotChanges = changesBySnapshot.get(snapshot.id) || []
                return (
                  <TableRow key={snapshot.id}>
                    <TableCell>
                      <Link href={snapshot.source.url} className="text-primary hover:underline" target="_blank">
                        {snapshot.source.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{snapshot.source.provider}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[snapshot.status] || ""}>
                        {snapshot.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {snapshotChanges.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {snapshotChanges.map((change) => (
                            <Link
                              key={change.id}
                              href={`/runs/${run.id}/diff/${snapshot.id}?changeId=${change.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              <Badge className={significanceColor(change.significance)}>
                                {change.changeType} ({change.significance})
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      ) : snapshot.status === "success" ? (
                        <span className="text-sm text-muted-foreground">No change</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{snapshot.statusCode ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {snapshot.contentHash ? snapshot.contentHash.slice(0, 12) + "..." : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-destructive">
                      {snapshot.errorMessage || "—"}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {run.changes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detected Changes</h2>
          <div className="space-y-3">
            {run.changes.map((change) => (
              <div
                key={change.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{change.source.name}</p>
                    <p className="text-xs text-muted-foreground">{change.source.provider}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={significanceColor(change.significance)}>
                      {change.significance}
                    </Badge>
                    <Badge variant="outline">{change.changeType}</Badge>
                    <Link
                      href={`/runs/${run.id}/diff/${change.snapshotId}?changeId=${change.id}`}
                      className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-accent"
                    >
                      View Diff
                    </Link>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {change.changedText.slice(0, 300)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
