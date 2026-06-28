import Link from "next/link"
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
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  exported: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export default async function NewslettersPage() {
  const newsletters = await prisma.newsletter.findMany({
    include: {
      run: { select: { id: true, startedAt: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex-1 p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Newsletters</h1>
        <p className="text-muted-foreground mt-1">
          Generated newsletter drafts from scan runs
        </p>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Run Date</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsletters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No newsletters yet. Run a scan to generate one.
                </TableCell>
              </TableRow>
            ) : (
              newsletters.map((newsletter) => (
                <TableRow key={newsletter.id}>
                  <TableCell>
                    <Link
                      href={`/newsletters/${newsletter.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {newsletter.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[newsletter.status] || ""}>
                      {newsletter.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{newsletter._count.items}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(newsletter.run.startedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(newsletter.createdAt).toLocaleDateString()}
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
