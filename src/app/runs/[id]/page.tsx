import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
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
    },
  })

  if (!run) {
    notFound()
  }

  const successCount = run.snapshots.filter((s) => s.status === "success").length
  const failedCount = run.snapshots.filter((s) => s.status === "failed").length

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

      <div className="grid gap-4 md:grid-cols-4 mb-8">
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
              <TableHead>HTTP Code</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {run.snapshots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No snapshots for this run.
                </TableCell>
              </TableRow>
            ) : (
              run.snapshots.map((snapshot) => (
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
                  <TableCell>{snapshot.statusCode ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {snapshot.contentHash ? snapshot.contentHash.slice(0, 12) + "..." : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-destructive">
                    {snapshot.errorMessage || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}