import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/db"

let sourceId: string
let runId: string
let snapshotId: string
let changeId: string
let newsletterId: string
let itemId: string

beforeAll(async () => {
  const source = await prisma.source.create({
    data: {
      provider: "Test Provider",
      name: "Test Newsletters API",
      url: `https://test-newsletters-api-${Date.now()}.example.com`,
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
      contentHash: "test-hash",
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
      changedText: "Test change content",
    },
  })
  changeId = change.id

  const newsletter = await prisma.newsletter.create({
    data: {
      runId,
      title: "Test Newsletter API",
      markdownBody: "# Test",
      status: "draft",
      items: {
        create: [
          {
            sourceId,
            detectedChangeId: changeId,
            title: "Test Item",
            provider: "Test Provider",
            category: "Test Newsletters API",
            impactLevel: "medium",
            summary: "Test summary",
            whyItMatters: "Test reason",
            sourceUrl: source.url,
            confidence: "medium",
            approved: false,
          },
        ],
      },
    },
    include: { items: true },
  })
  newsletterId = newsletter.id
  itemId = newsletter.items[0].id
})

afterAll(async () => {
  await prisma.newsletterItem.deleteMany({ where: { newsletterId } })
  await prisma.newsletter.delete({ where: { id: newsletterId } })
  await prisma.detectedChange.delete({ where: { id: changeId } })
  await prisma.snapshot.delete({ where: { id: snapshotId } })
  await prisma.run.delete({ where: { id: runId } })
  await prisma.source.delete({ where: { id: sourceId } })
})

const BASE = "http://localhost:3000"

describe("Newsletter API routes", () => {
  it("GET /api/newsletters returns list", async () => {
    const res = await fetch(`${BASE}/api/newsletters`)
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(Array.isArray(data)).toBe(true)
    expect(data.some((n: { id: string }) => n.id === newsletterId)).toBe(true)
  })

  it("GET /api/newsletters/[id] returns newsletter with items", async () => {
    const res = await fetch(`${BASE}/api/newsletters/${newsletterId}`)
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.id).toBe(newsletterId)
    expect(data.items).toBeDefined()
    expect(data.items.length).toBe(1)
    expect(data.items[0].approved).toBe(false)
  })

  it("GET /api/newsletters/[id] returns 404 for invalid ID", async () => {
    const res = await fetch(`${BASE}/api/newsletters/nonexistent`)
    expect(res.status).toBe(404)
  })

  it("PATCH /api/newsletters/[id] updates status", async () => {
    const res = await fetch(`${BASE}/api/newsletters/${newsletterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reviewed" }),
    })
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.status).toBe("reviewed")

    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: { status: "draft" },
    })
  })

  it("PATCH /api/newsletters/[id]/items/[itemId] toggles approval", async () => {
    const res = await fetch(`${BASE}/api/newsletters/${newsletterId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    })
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.approved).toBe(true)

    await prisma.newsletterItem.update({
      where: { id: itemId },
      data: { approved: false },
    })
  })

  it("PATCH /api/newsletters/[id]/items/[itemId] returns 404 for invalid item", async () => {
    const res = await fetch(`${BASE}/api/newsletters/${newsletterId}/items/nonexistent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    })
    expect(res.status).toBe(404)
  })

  it("PATCH /api/newsletters/[id]/items/approve-all approves all items", async () => {
    const res = await fetch(`${BASE}/api/newsletters/${newsletterId}/items/approve-all`, {
      method: "PATCH",
    })
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data.updated).toBeGreaterThanOrEqual(1)

    await prisma.newsletterItem.update({
      where: { id: itemId },
      data: { approved: false },
    })
  })

  it("PATCH /api/newsletters/[id]/items/approve-all returns 404 for invalid newsletter", async () => {
    const res = await fetch(`${BASE}/api/newsletters/nonexistent/items/approve-all`, {
      method: "PATCH",
    })
    expect(res.status).toBe(404)
  })
})
