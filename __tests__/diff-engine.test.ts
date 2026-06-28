import { describe, it, expect } from "vitest"
import { computeDiff } from "@/lib/diff-engine"

describe("computeDiff", () => {
  it("returns no changes for identical text", () => {
    const result = computeDiff("hello world", "hello world")
    expect(result.hasChanges).toBe(false)
    expect(result.additions).toBe("")
    expect(result.removals).toBe("")
  })

  it("detects a single line change", () => {
    const prior = "line one\nline two\nline three"
    const current = "line one\nline CHANGED\nline three"
    const result = computeDiff(prior, current)
    expect(result.hasChanges).toBe(true)
    expect(result.removals).toContain("line two")
    expect(result.additions).toContain("line CHANGED")
  })

  it("detects added lines", () => {
    const prior = "line one\nline two"
    const current = "line one\nline two\nline three"
    const result = computeDiff(prior, current)
    expect(result.hasChanges).toBe(true)
    expect(result.additions).toContain("line three")
  })

  it("detects removed lines", () => {
    const prior = "line one\nline two\nline three"
    const current = "line one\nline three"
    const result = computeDiff(prior, current)
    expect(result.hasChanges).toBe(true)
    expect(result.removals).toContain("line two")
    expect(result.additions).toBe("")
  })

  it("handles empty prior text", () => {
    const result = computeDiff("", "new content here")
    expect(result.hasChanges).toBe(true)
    expect(result.additions).toContain("new content here")
    expect(result.removals).toBe("")
  })

  it("handles empty current text", () => {
    const result = computeDiff("old content here", "")
    expect(result.hasChanges).toBe(true)
    expect(result.removals).toContain("old content here")
    expect(result.additions).toBe("")
  })

  it("handles both empty", () => {
    const result = computeDiff("", "")
    expect(result.hasChanges).toBe(false)
  })

  it("detects multiple line changes", () => {
    const prior = "aaa\nbbb\nccc\nddd"
    const current = "aaa\nXXX\nccc\nYYY"
    const result = computeDiff(prior, current)
    expect(result.hasChanges).toBe(true)
    expect(result.removals).toContain("bbb")
    expect(result.removals).toContain("ddd")
    expect(result.additions).toContain("XXX")
    expect(result.additions).toContain("YYY")
  })

  it("returns segments array", () => {
    const result = computeDiff("aaa", "bbb")
    expect(result.segments).toBeDefined()
    expect(Array.isArray(result.segments)).toBe(true)
    expect(result.segments.length).toBeGreaterThan(0)
  })

  it("detects additions and removals together", () => {
    const prior = "keep this\nremove this"
    const current = "keep this\nadd this"
    const result = computeDiff(prior, current)
    expect(result.hasChanges).toBe(true)
    expect(result.additions).toContain("add this")
    expect(result.removals).toContain("remove this")
  })
})
