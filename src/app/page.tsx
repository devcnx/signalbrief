import Link from "next/link"
import { prisma } from "@/lib/db"
import { RunScanButton } from "@/components/run-scan-button"

export const dynamic = "force-dynamic"

export default async function Dashboard() {
  const sourceCount = await prisma.source.count()
  const activeCount = await prisma.source.count({ where: { active: true } })
  const latestRun = await prisma.run.findFirst({
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      status: true,
      sourcesChecked: true,
      changesFound: true,
      errorsCount: true,
    },
  })

  return (
    <div className="flex-1 p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Sources</p>
          <p className="text-2xl font-semibold mt-1">{sourceCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Active Sources</p>
          <p className="text-2xl font-semibold mt-1">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Last Run</p>
          <p className="text-sm mt-1">
            {latestRun ? (
              <Link href={`/runs/${latestRun.id}`} className="text-primary underline underline-offset-4 hover:text-primary/80">
                {latestRun.status.replace(/_/g, " ")} — {latestRun.sourcesChecked} checked
                {latestRun.changesFound > 0 ? `, ${latestRun.changesFound} change(s)` : ""}
                {latestRun.errorsCount > 0 ? `, ${latestRun.errorsCount} error(s)` : ""}
              </Link>
            ) : (
              "No runs yet"
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <RunScanButton />
        <Link
          href="/runs"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-5 text-sm font-medium hover:bg-accent"
        >
          View Run History
        </Link>
        <Link
          href="/sources"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-5 text-sm font-medium hover:bg-accent"
        >
          Manage Sources
        </Link>
      </div>
    </div>
  )
}