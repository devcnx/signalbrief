import { describe, it, expect } from "vitest"
import {
  parseChangedText,
  stripDiffMarkers,
  buildReadableTitle,
  buildReadableSummary,
  buildChangePreview,
} from "@/lib/readability"

describe("parseChangedText", () => {
  it("parses additions and removals from standard diff format", () => {
    const changedText = "--- removed\n- old line\n+++ added\n+ new line"
    const result = parseChangedText(changedText)
    expect(result.removals).toEqual(["old line"])
    expect(result.additions).toEqual(["new line"])
  })

  it("handles additions only", () => {
    const changedText = "+++ added\n+ new feature"
    const result = parseChangedText(changedText)
    expect(result.additions).toEqual(["new feature"])
    expect(result.removals).toEqual([])
  })

  it("handles removals only", () => {
    const changedText = "--- removed\n- old feature"
    const result = parseChangedText(changedText)
    expect(result.removals).toEqual(["old feature"])
    expect(result.additions).toEqual([])
  })

  it("handles multiple lines per section", () => {
    const changedText = "--- removed\n- line one\n- line two\n+++ added\n+ line three\n+ line four"
    const result = parseChangedText(changedText)
    expect(result.removals).toEqual(["line one", "line two"])
    expect(result.additions).toEqual(["line three", "line four"])
  })

  it("returns empty arrays for empty input", () => {
    const result = parseChangedText("")
    expect(result.additions).toEqual([])
    expect(result.removals).toEqual([])
  })
})

describe("stripDiffMarkers", () => {
  it("removes diff markers and formats additions + removals", () => {
    const changedText = "--- removed\n- old text\n+++ added\n+ new text"
    const result = stripDiffMarkers(changedText)
    expect(result).toContain("new text")
    expect(result).toContain("old text")
    expect(result).not.toContain("--- removed")
    expect(result).not.toContain("+++ added")
    expect(result).not.toContain("- ")
    expect(result).not.toContain("+ ")
  })

  it("returns additions only when no removals", () => {
    const changedText = "+++ added\n+ new content"
    const result = stripDiffMarkers(changedText)
    expect(result).toBe("new content")
    expect(result).not.toContain("+++")
  })

  it("prefixes removals when no additions", () => {
    const changedText = "--- removed\n- old content"
    const result = stripDiffMarkers(changedText)
    expect(result).toBe("Removed: old content")
  })

  it("joins multiple lines with spaces", () => {
    const changedText = "+++ added\n+ line one\n+ line two"
    const result = stripDiffMarkers(changedText)
    expect(result).toBe("line one line two")
  })

  it("handles empty changedText", () => {
    expect(stripDiffMarkers("")).toBe("")
  })

  it("falls back to regex strip for non-standard format", () => {
    const changedText = "- some line\n+ another line"
    const result = stripDiffMarkers(changedText)
    expect(result).toContain("some line")
    expect(result).toContain("another line")
  })
})

describe("buildReadableTitle", () => {
  it("uses first addition for new changes", () => {
    const changedText = "+++ added\n+ New GPT-5 model released\n+ More details"
    const title = buildReadableTitle(changedText, "OpenAI Changelog", "new")
    expect(title).toBe("New GPT-5 model released")
  })

  it("uses first removal when no additions", () => {
    const changedText = "--- removed\n- Deprecated API endpoint"
    const title = buildReadableTitle(changedText, "Source", "updated")
    expect(title).toBe("Deprecated API endpoint")
  })

  it("truncates long titles", () => {
    const longLine = "A".repeat(100)
    const changedText = `+++ added\n+ ${longLine}`
    const title = buildReadableTitle(changedText, "Source", "new")
    expect(title.length).toBe(80)
    expect(title.endsWith("...")).toBe(true)
  })

  it("falls back to source name when no parseable content", () => {
    const title = buildReadableTitle("", "My Source", "new")
    expect(title).toBe("My Source")
  })

  it("prefers additions over removals for updated changes", () => {
    const changedText = "--- removed\n- old\n+++ added\n+ new"
    const title = buildReadableTitle(changedText, "Source", "updated")
    expect(title).toBe("new")
  })
})

describe("buildReadableSummary", () => {
  it("strips diff markers for readable summary", () => {
    const changedText = "--- removed\n- old text\n+++ added\n+ new text"
    const summary = buildReadableSummary(changedText)
    expect(summary).not.toContain("---")
    expect(summary).not.toContain("+++")
    expect(summary).not.toMatch(/^[-+] /m)
  })

  it("respects max length", () => {
    const changedText = `+++ added\n+ ${"A".repeat(500)}`
    const summary = buildReadableSummary(changedText, 50)
    expect(summary.length).toBe(50)
    expect(summary.endsWith("...")).toBe(true)
  })

  it("uses default max length of 400", () => {
    const changedText = `+++ added\n+ ${"A".repeat(500)}`
    const summary = buildReadableSummary(changedText)
    expect(summary.length).toBe(400)
  })
})

describe("buildChangePreview", () => {
  it("strips diff markers for preview", () => {
    const changedText = "--- removed\n- old\n+++ added\n+ new content here"
    const preview = buildChangePreview(changedText)
    expect(preview).not.toContain("---")
    expect(preview).not.toContain("+++")
    expect(preview).toContain("new content here")
  })

  it("truncates to 200 chars by default", () => {
    const changedText = `+++ added\n+ ${"A".repeat(300)}`
    const preview = buildChangePreview(changedText)
    expect(preview.length).toBe(200)
  })

  it("respects custom max length", () => {
    const changedText = `+++ added\n+ ${"A".repeat(300)}`
    const preview = buildChangePreview(changedText, 100)
    expect(preview.length).toBe(100)
  })
})