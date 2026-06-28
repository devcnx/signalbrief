import { describe, it, expect } from "vitest"
import { escapeMarkdown, buildMarkdown, buildHtml, getWhyItMatters, truncate } from "@/lib/newsletter-builder"

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

describe("buildMarkdown", () => {
  const baseItem = {
    provider: "OpenAI",
    sourceName: "Changelog",
    sourceUrl: "https://openai.com/changelog",
    summary: "Added new model GPT-5",
    impactLevel: "high",
    approved: true,
  }

  it("does not contain signalbrief.local", () => {
    const md = buildMarkdown("Test Newsletter", [baseItem])
    expect(md).not.toContain("signalbrief.local")
  })

  it("links to actual source URL when provided", () => {
    const md = buildMarkdown("Test", [baseItem])
    expect(md).toContain("[Source](https://openai.com/changelog)")
  })

  it("shows source name as plain text when URL is null", () => {
    const item = { ...baseItem, sourceUrl: null }
    const md = buildMarkdown("Test", [item])
    expect(md).toContain("Source: Changelog")
    expect(md).not.toContain("[Source](")
  })

  it("only includes approved items", () => {
    const approved = { ...baseItem, approved: true }
    const rejected = { ...baseItem, provider: "Anthropic", approved: false }
    const md = buildMarkdown("Test", [approved, rejected])
    expect(md).toContain("OpenAI")
    expect(md).not.toContain("Anthropic")
  })

  it("groups items by impact level", () => {
    const high = { ...baseItem, impactLevel: "high" }
    const low = { ...baseItem, provider: "Google", impactLevel: "low" }
    const md = buildMarkdown("Test", [high, low])
    const highIdx = md.indexOf("## High Impact")
    const lowIdx = md.indexOf("## Low Impact")
    expect(highIdx).toBeLessThan(lowIdx)
  })

  it("shows placeholder when no items approved", () => {
    const md = buildMarkdown("Test", [])
    expect(md).toContain("No items approved yet")
  })
})

describe("getWhyItMatters", () => {
  it("returns high-impact new message", () => {
    expect(getWhyItMatters("high", "new")).toContain("immediate review")
  })

  it("returns high-impact updated message", () => {
    expect(getWhyItMatters("high", "updated")).toContain("Significant update")
  })

  it("returns medium-impact message", () => {
    expect(getWhyItMatters("medium", "new")).toContain("worth reviewing")
  })

  it("returns low-impact message", () => {
    expect(getWhyItMatters("low", "updated")).toContain("probably low impact")
  })

  it("returns fallback for unknown combination", () => {
    expect(getWhyItMatters("unknown", "unknown")).toContain("review to assess impact")
  })
})

describe("truncate", () => {
  it("returns text unchanged when under limit", () => {
    expect(truncate("short", 100)).toBe("short")
  })

  it("truncates long text with ellipsis", () => {
    expect(truncate("a".repeat(100), 50)).toBe("a".repeat(47) + "...")
  })
})

describe("buildHtml", () => {
  it("renders h1 headings", () => {
    const html = buildHtml("# Title")
    expect(html).toContain("<h1>Title</h1>")
  })

  it("renders h2 headings", () => {
    const html = buildHtml("## Section")
    expect(html).toContain("<h2>Section</h2>")
  })

  it("renders h3 headings", () => {
    const html = buildHtml("### Subsection")
    expect(html).toContain("<h3>Subsection</h3>")
  })

  it("renders links with href", () => {
    const html = buildHtml("[OpenAI](https://openai.com)")
    expect(html).toContain('<a href="https://openai.com">OpenAI</a>')
  })

  it("renders bold text", () => {
    const html = buildHtml("**important**")
    expect(html).toContain("<strong>important</strong>")
  })

  it("renders italic text", () => {
    const html = buildHtml("*emphasis*")
    expect(html).toContain("<em>emphasis</em>")
  })

  it("renders unordered lists", () => {
    const md = "- Item one\n- Item two"
    const html = buildHtml(md)
    expect(html).toContain("<ul>")
    expect(html).toContain("<li>Item one</li>")
    expect(html).toContain("<li>Item two</li>")
  })

  it("renders code blocks", () => {
    const md = "```\nconst x = 1\n```"
    const html = buildHtml(md)
    expect(html).toContain("<code>")
    expect(html).toContain("const x = 1")
  })

  it("renders inline code", () => {
    const html = buildHtml("Use `npm install`")
    expect(html).toContain("<code>npm install</code>")
  })

  it("sanitizes raw HTML from input", () => {
    const html = buildHtml("<script>alert('xss')</script>")
    expect(html).not.toContain("<script>")
    expect(html).not.toContain("alert")
  })

  it("sanitizes injected HTML in text", () => {
    const html = buildHtml("Normal text <img src=x onerror=alert(1)>")
    expect(html).not.toContain("<img")
    expect(html).not.toContain("onerror")
  })

  it("contains full HTML document structure", () => {
    const html = buildHtml("# Test")
    expect(html).toContain("<!DOCTYPE html>")
    expect(html).toContain("<html")
    expect(html).toContain("<head>")
    expect(html).toContain("<body>")
    expect(html).toContain("</html>")
  })
})

describe("buildMarkdown metadata", () => {
  const baseItem = {
    provider: "OpenAI",
    sourceName: "Changelog",
    sourceUrl: "https://openai.com/changelog",
    summary: "Added GPT-5 model",
    impactLevel: "high",
    approved: true,
  }

  it("includes title as h1", () => {
    const md = buildMarkdown("My Newsletter", [baseItem])
    expect(md).toContain("# My Newsletter")
  })

  it("includes generated date", () => {
    const md = buildMarkdown("Test", [baseItem])
    expect(md).toContain("Generated:")
  })

  it("includes provider and source name in h3", () => {
    const md = buildMarkdown("Test", [baseItem])
    expect(md).toContain("### OpenAI — Changelog")
  })

  it("includes source URL as link", () => {
    const md = buildMarkdown("Test", [baseItem])
    expect(md).toContain("[Source](https://openai.com/changelog)")
  })

  it("uses plain text source when URL is null", () => {
    const item = { ...baseItem, sourceUrl: null }
    const md = buildMarkdown("Test", [item])
    expect(md).toContain("Source: Changelog")
    expect(md).not.toContain("[Source](")
  })

  it("escapes special characters in summary", () => {
    const item = { ...baseItem, summary: "Use *bold* and # headers carefully" }
    const md = buildMarkdown("Test", [item])
    expect(md).toContain("\\*bold\\*")
    expect(md).toContain("\\# headers")
  })

  it("renders HTML from markdown", () => {
    const md = buildMarkdown("Test", [baseItem])
    const html = buildHtml(md)
    expect(html).toContain("<h1>Test</h1>")
    expect(html).toContain("OpenAI")
    expect(html).toContain("Changelog")
  })
})
