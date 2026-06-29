import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/db"

let sourceId: string
let runId: string
let snapshotId: string
let changeId: string
let newsletterId: string

beforeAll(async () => {
  const source = await prisma.source.create({
    data: {
      provider: "Delete Test Provider",
      name: "Delete Test Source",
      url: `https://delete-test-${Date.now()}.example.com`,
      type: "changelog",
      category: "api",
      priority: "medium",
    },
  })
  sourceId = source.id

  const run = await prisma.run.create({
    data: { status: "completed", sourcesChecked: 1 },
  })
  runId = run.id

  const snapshot = await prisma.snapshot.create({
    data: {
      sourceId,
      runId,
      status: "success",
      statusCode: 200,
      contentHash: "delete-test-hash",
    },
  })
  snapshotId = snapshot.id

  const change = await prisma.detectedChange.create({
    data: {
      sourceId,
      runId,
      snapshotId,
      changeType: "updated",
      significance: "medium",
      changedText: "Delete test change",
    },
  })
  changeId = change.id

  const newsletter = await prisma.newsletter.create({
    data: {
      runId,
      title: "Delete Test Newsletter",
      markdownBody: "# Delete Test",
      status: "draft",
      items: {
        create: [
          {
            sourceId,
            detectedChangeId: changeId,
            title: "Delete Test Item",
            provider: "Delete Test Provider",
            category: "api",
            impactLevel: "medium",
            summary: "Delete test summary",
            whyItMatters: "Delete test reason",
            sourceUrl: source.url,
            confidence: "medium",
            approved: false,
          },
        ],
      },
    },
  })
  newsletterId = newsletter.id
})

afterAll(async () => {
  // Clean up the soft-deactivate test data (source still exists, just inactive)
  const remainingSource = await prisma.source.findUnique({ where: { id: sourceId } })
  if (remainingSource) {
    await prisma.source.delete({ where: { id: sourceId } })
  }
  // The run may still exist since it's not cascaded from Source
  const remainingRun = await prisma.run.findUnique({ where: { id: runId } })
  if (remainingRun) {
    // Newsletter must be deleted first (it references the run)
    const remainingNewsletter = await prisma.newsletter.findUnique({ where: { runId } })
    if (remainingNewsletter) {
      await prisma.newsletter.delete({ where: { id: remainingNewsletter.id } })
    }
    await prisma.run.delete({ where: { id: runId } })
  }
})

const BASE = "http://localhost:3000"

describe("Source DELETE API — soft deactivate", () => {
  it("DELETE /api/sources/[id] (no permanent flag) deactivates source", async () => {
    const res = await fetch(`${BASE}/api/sources/${sourceId}`, {
      method: "DELETE",
    })
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.active).toBe(false)
    expect(data.id).toBe(sourceId)

    // Verify related data still exists
    const snapshot = await prisma.snapshot.findUnique({ where: { id: snapshotId } })
    expect(snapshot).not.toBeNull()
    const change = await prisma.detectedChange.findUnique({ where: { id: changeId } })
    expect(change).not.toBeNull()
  })
})

describe("Source DELETE API — permanent delete with cascade", () => {
  let permSourceId: string
  let permSnapshotId: string
  let permChangeId: string
  let permNewsletterItemId: string

  beforeAll(async () => {
    const source = await prisma.source.create({
      data: {
        provider: "Perm Delete Provider",
        name: "Perm Delete Source",
        url: `https://perm-delete-${Date.now()}.example.com`,
        type: "changelog",
        category: "api",
        priority: "high",
      },
    })
    permSourceId = source.id

    const run = await prisma.run.create({
      data: { status: "completed", sourcesChecked: 1 },
    })

    const snapshot = await prisma.snapshot.create({
      data: {
        sourceId: permSourceId,
        runId: run.id,
        status: "success",
        statusCode: 200,
        contentHash: "perm-delete-hash",
      },
    })
    permSnapshotId = snapshot.id

    const change = await prisma.detectedChange.create({
      data: {
        sourceId: permSourceId,
        runId: run.id,
        snapshotId: permSnapshotId,
        changeType: "new",
        significance: "high",
        changedText: "Perm delete test change",
      },
    })
    permChangeId = change.id

    const newsletter = await prisma.newsletter.create({
      data: {
        runId: run.id,
        title: "Perm Delete Newsletter",
        markdownBody: "# Perm Delete",
        status: "draft",
        items: {
          create: [
            {
              sourceId: permSourceId,
              detectedChangeId: permChangeId,
              title: "Perm Delete Item",
              provider: "Perm Delete Provider",
              category: "api",
              impactLevel: "high",
              summary: "Perm delete summary",
              whyItMatters: "Perm delete reason",
              sourceUrl: source.url,
              confidence: "high",
              approved: false,
            },
          ],
        },
      },
      include: { items: true },
    })
    permNewsletterItemId = newsletter.items[0].id

    // Clean up the run after — it has no Source cascade, so it lingers
    // We'll delete it in afterAll via the run ID stored above
  })

  afterAll(async () => {
    // The source and all related data (snapshots, changes, newsletter items)
    // are gone via cascade. The Newsletter and Run still exist — clean them up.
    const runs = await prisma.run.findMany({
      where: { snapshots: { none: {} } },
    })
    for (const r of runs) {
      const newsletter = await prisma.newsletter.findUnique({ where: { runId: r.id } })
      if (newsletter) {
        await prisma.newsletter.delete({ where: { id: newsletter.id } }).catch(() => {})
      }
      await prisma.run.delete({ where: { id: r.id } }).catch(() => {})
    }
  })

  it("DELETE /api/sources/[id]?permanent=true removes source and cascades", async () => {
    const res = await fetch(`${BASE}/api/sources/${permSourceId}?permanent=true`, {
      method: "DELETE",
    })
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.deleted).toBe(true)
    expect(data.id).toBe(permSourceId)

    // Source is gone
    const source = await prisma.source.findUnique({ where: { id: permSourceId } })
    expect(source).toBeNull()

    // Snapshots cascaded
    const snapshot = await prisma.snapshot.findUnique({ where: { id: permSnapshotId } })
    expect(snapshot).toBeNull()

    // Changes cascaded
    const change = await prisma.detectedChange.findUnique({ where: { id: permChangeId } })
    expect(change).toBeNull()

    // Newsletter items cascaded
    const item = await prisma.newsletterItem.findUnique({ where: { id: permNewsletterItemId } })
    expect(item).toBeNull()
  })
})

describe("Source DELETE API — edge cases", () => {
  it("DELETE /api/sources/[id] returns 404 for nonexistent source", async () => {
    const res = await fetch(`${BASE}/api/sources/nonexistent-id`, {
      method: "DELETE",
    })
    expect(res.status).toBe(404)
  })

  it("DELETE /api/sources/[id]?permanent=true returns 404 for nonexistent source", async () => {
    const res = await fetch(`${BASE}/api/sources/nonexistent-id?permanent=true`, {
      method: "DELETE",
    })
    expect(res.status).toBe(404)
  })
})