import Link from "next/link"
import { prisma } from "@/lib/db"

export default async function Dashboard() {
  const sourceCount = await prisma.source.count()
  const activeCount = await prisma.source.count({ where: { active: true } })

  return (
    <div className="flex-1 p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Sources</p>
          <p className="text-2xl font-semibold mt-1">{sourceCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Active Sources</p>
          <p className="text-2xl font-semibold mt-1">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Next Step</p>
          <p className="text-sm mt-1">
            {sourceCount === 0 ? (
              <Link href="/sources" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Add your first source
              </Link>
            ) : (
              "Ready to scan — coming in Phase 5"
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
