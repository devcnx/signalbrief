import { describe, it, expect } from "vitest"
import { escapeMarkdown } from "@/lib/newsletter-builder"

describe("escapeMarkdown", () => {
  it("escapes heading markers", () => {
    expect(escapeMarkdown("# heading")).toBe("\\# heading")
  })

  it("escapes emphasis markers", () => {
    expect(escapeMarkdown("*emphasis*")).toBe("\\*emphasis\\*")
  })

  it("escapes link syntax", () => {
    expect(escapeMarkdown("[link text](url)")).toBe("\\[link text\\](url)")
  })

  it("escapes backticks", () => {
    expect(escapeMarkdown("`code`")).toBe("\\`code\\`")
  })

  it("escapes brackets", () => {
    expect(escapeMarkdown("[text]")).toBe("\\[text\\]")
  })

  it("does not escape exclamation marks", () => {
    expect(escapeMarkdown("!image")).toBe("!image")
  })

  it("handles mixed markdown characters", () => {
    const input = "# Title with *emphasis* and [link]"
    const result = escapeMarkdown(input)
    expect(result).toBe("\\# Title with \\*emphasis\\* and \\[link\\]")
  })

  it("leaves plain text unchanged", () => {
    expect(escapeMarkdown("normal text")).toBe("normal text")
  })

  it("handles empty string", () => {
    expect(escapeMarkdown("")).toBe("")
  })
})
