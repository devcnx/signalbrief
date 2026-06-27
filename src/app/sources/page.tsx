import { prisma } from "@/lib/db"
import { SourcesTable } from "@/components/sources-table"

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex-1 p-8">
      <SourcesTable sources={sources} />
    </div>
  )
}
