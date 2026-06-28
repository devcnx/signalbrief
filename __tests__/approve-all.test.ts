import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/db"

let newsletterId: string

beforeAll(async () => {
  const source = await prisma.source.create({
    data: {
      provider: "Test",
      name: "Test Source",
      url: `https://test-approve-all-${Date.now()}.example.com`,
      type: "changelog",
      category: "api",
      priority: "medium",
    },
  })

  const run = await prisma.run.create({
    data: { status: "completed", sourcesChecked: 1 },
  })

  const snapshot = await prisma.snapshot.create({
    data: {
      sourceId: source.id,
      runId: run.id,
      status: "success",
      statusCode: 200,
      contentHash: "test-hash",
    },
  })

  const change = await prisma.detectedChange.create({
    data: {
      sourceId: source.id,
      runId: run.id,
      snapshotId: snapshot.id,
      changeType: "updated",
      significance: "medium",
      changedText: "Test change",
    },
  })

  const newsletter = await prisma.newsletter.create({
    data: {
      runId: run.id,
      title: "Test Newsletter",
      markdownBody: "# Test",
      status: "draft",
      items: {
        create: [
          {
            sourceId: source.id,
            detectedChangeId: change.id,
            title: "Item 1",
            provider: "Test",
            category: "Test Source",
            impactLevel: "medium",
            summary: "Summary 1",
            whyItMatters: "Test",
            sourceUrl: "https://test.example.com",
            confidence: "medium",
            approved: false,
          },
        ],
      },
    },
    include: { items: true },
  })

  newsletterId = newsletter.id
})

afterAll(async () => {
  await prisma.newsletterItem.deleteMany({ where: { newsletterId } })
  await prisma.newsletter.delete({ where: { id: newsletterId } })
})

describe("PATCH /api/newsletters/[id]/items/approve-all", () => {
  it("approves all items in one request", async () => {
    const res = await fetch(`http://localhost:3000/api/newsletters/${newsletterId}/items/approve-all`, {
      method: "PATCH",
    })
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.updated).toBeGreaterThanOrEqual(1)
  })

  it("returns 0 updated when all already approved", async () => {
    const res = await fetch(`http://localhost:3000/api/newsletters/${newsletterId}/items/approve-all`, {
      method: "PATCH",
    })
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.updated).toBe(0)
  })

  it("returns 404 for nonexistent newsletter", async () => {
    const res = await fetch("http://localhost:3000/api/newsletters/nonexistent/items/approve-all", {
      method: "PATCH",
    })
    expect(res.status).toBe(404)
  })
})
