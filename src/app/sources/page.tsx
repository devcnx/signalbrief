import { prisma } from "@/lib/db"
import { SourcesTable } from "@/components/sources-table"

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: "desc" },
  })

  const serialized = sources.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <div className="flex-1 p-8">
      <SourcesTable sources={serialized} />
    </div>
  )
}
