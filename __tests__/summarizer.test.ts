import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  fillTemplate,
  validateOutput,
  noAiFallback,
  getProvider,
  hasAiProvider,
} from "@/lib/summarizer"
import type { SummarizationInput } from "@/lib/types"

const baseInput: SummarizationInput = {
  provider: "OpenAI",
  sourceName: "OpenAI API Changelog",
  sourceUrl: "https://platform.openai.com/docs/changelog",
  category: "api",
  priority: "high",
  changedText: "+++ added\n+ New GPT-5 model with 128k context window",
}

describe("getProvider", () => {
  const originalEnv = process.env.AI_PROVIDER

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AI_PROVIDER
    } else {
      process.env.AI_PROVIDER = originalEnv
    }
  })

  it("returns null when AI_PROVIDER is not set", () => {
    delete process.env.AI_PROVIDER
    expect(getProvider()).toBeNull()
  })

  it("returns null when AI_PROVIDER is empty", () => {
    process.env.AI_PROVIDER = ""
    expect(getProvider()).toBeNull()
  })

  it("returns null when AI_PROVIDER is none", () => {
    process.env.AI_PROVIDER = "none"
    expect(getProvider()).toBeNull()
  })

  it("returns null for unknown provider", () => {
    process.env.AI_PROVIDER = "unknown"
    expect(getProvider()).toBeNull()
  })

  it("returns openai for valid provider", () => {
    process.env.AI_PROVIDER = "openai"
    expect(getProvider()).toBe("openai")
  })

  it("returns anthropic for valid provider", () => {
    process.env.AI_PROVIDER = "anthropic"
    expect(getProvider()).toBe("anthropic")
  })

  it("returns ollama for valid provider", () => {
    process.env.AI_PROVIDER = "ollama"
    expect(getProvider()).toBe("ollama")
  })

  it("is case insensitive", () => {
    process.env.AI_PROVIDER = "OpenAI"
    expect(getProvider()).toBe("openai")
  })
})

describe("hasAiProvider", () => {
  const originalProvider = process.env.AI_PROVIDER
  const originalKey = process.env.OPENAI_API_KEY

  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env.AI_PROVIDER
    } else {
      process.env.AI_PROVIDER = originalProvider
    }
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = originalKey
    }
  })

  it("returns false when no provider set", () => {
    delete process.env.AI_PROVIDER
    expect(hasAiProvider()).toBe(false)
  })

  it("returns false when provider set but no API key", () => {
    process.env.AI_PROVIDER = "openai"
    delete process.env.OPENAI_API_KEY
    expect(hasAiProvider()).toBe(false)
  })

  it("returns true for ollama without API key", () => {
    process.env.AI_PROVIDER = "ollama"
    expect(hasAiProvider()).toBe(true)
  })
})

describe("fillTemplate", () => {
  it("replaces all placeholders", () => {
    const template = "Provider: {{provider}}, Source: {{sourceName}}, URL: {{sourceUrl}}"
    const result = fillTemplate(template, baseInput)
    expect(result).toBe("Provider: OpenAI, Source: OpenAI API Changelog, URL: https://platform.openai.com/docs/changelog")
  })

  it("replaces changedText placeholder", () => {
    const template = "Changed: {{changedText}}"
    const result = fillTemplate(template, baseInput)
    expect(result).toContain("New GPT-5 model")
  })

  it("uses audience or defaults to technical", () => {
    const template = "Audience: {{audience}}"
    const withoutAudience = { ...baseInput, audience: undefined }
    const result = fillTemplate(template, withoutAudience)
    expect(result).toBe("Audience: technical")
  })

  it("joins audience array with commas", () => {
    const template = "Audience: {{audience}}"
    const withAudience = { ...baseInput, audience: ["builders", "ai_enablement"] }
    const result = fillTemplate(template, withAudience)
    expect(result).toBe("Audience: builders, ai_enablement")
  })
})

describe("validateOutput", () => {
  it("returns null for non-object input", () => {
    expect(validateOutput(null as never, baseInput)).toBeNull()
    expect(validateOutput("string" as never, baseInput)).toBeNull()
    expect(validateOutput(42 as never, baseInput)).toBeNull()
  })

  it("returns null when summary is missing", () => {
    expect(validateOutput({ title: "test" }, baseInput)).toBeNull()
  })

  it("returns null when summary is empty", () => {
    expect(validateOutput({ summary: "" }, baseInput)).toBeNull()
  })

  it("returns valid draft with all fields", () => {
    const raw = {
      title: "GPT-5 Released",
      provider: "OpenAI",
      category: "model",
      impactLevel: "high",
      summary: "New model with 128k context.",
      whyItMatters: "Significant capability increase.",
      recommendedAction: "Test with your workloads",
      sourceUrl: "https://example.com",
      confidence: "high",
      needsReview: false,
    }
    const result = validateOutput(raw, baseInput)
    expect(result).not.toBeNull()
    expect(result!.title).toBe("GPT-5 Released")
    expect(result!.impactLevel).toBe("high")
    expect(result!.summary).toBe("New model with 128k context.")
    expect(result!.confidence).toBe("high")
    expect(result!.needsReview).toBe(false)
    expect(result!.recommendedAction).toBe("Test with your workloads")
  })

  it("defaults impactLevel to low for invalid value", () => {
    const raw = { summary: "test", impactLevel: "critical" }
    const result = validateOutput(raw, baseInput)
    expect(result!.impactLevel).toBe("low")
  })

  it("defaults confidence to low for invalid value", () => {
    const raw = { summary: "test", confidence: "very_high" }
    const result = validateOutput(raw, baseInput)
    expect(result!.confidence).toBe("low")
  })

  it("uses input provider when not in response", () => {
    const raw = { summary: "test" }
    const result = validateOutput(raw, baseInput)
    expect(result!.provider).toBe("OpenAI")
  })

  it("uses input sourceUrl when not in response", () => {
    const raw = { summary: "test" }
    const result = validateOutput(raw, baseInput)
    expect(result!.sourceUrl).toBe("https://platform.openai.com/docs/changelog")
  })

  it("defaults recommendedAction to null", () => {
    const raw = { summary: "test" }
    const result = validateOutput(raw, baseInput)
    expect(result!.recommendedAction).toBeNull()
  })

  it("defaults needsReview to true", () => {
    const raw = { summary: "test" }
    const result = validateOutput(raw, baseInput)
    expect(result!.needsReview).toBe(true)
  })

  it("generates title from changedText when missing", () => {
    const raw = { summary: "test" }
    const result = validateOutput(raw, baseInput)
    expect(result!.title).toBeTruthy()
    expect(result!.title.length).toBeGreaterThan(0)
  })

  it("AI response category overrides input category", () => {
    const raw = { summary: "test", category: "model" }
    const result = validateOutput(raw, baseInput)
    expect(result!.category).toBe("model")
  })

  it("input sourceUrl is used (not overridable by AI)", () => {
    const raw = { summary: "test", sourceUrl: "https://other.com" }
    const result = validateOutput(raw, baseInput)
    expect(result!.sourceUrl).toBe("https://platform.openai.com/docs/changelog")
  })

  it("input provider is used (not overridable by AI)", () => {
    const raw = { summary: "test", provider: "Anthropic" }
    const result = validateOutput(raw, baseInput)
    expect(result!.provider).toBe("OpenAI")
  })
})

describe("noAiFallback", () => {
  it("returns a valid NewsletterItemDraft", () => {
    const result = noAiFallback(baseInput)
    expect(result.provider).toBe("OpenAI")
    expect(result.category).toBe("api")
    expect(result.sourceUrl).toBe("https://platform.openai.com/docs/changelog")
    expect(result.summary).toBeTruthy()
    expect(result.title).toBeTruthy()
    expect(result.whyItMatters).toBeTruthy()
    expect(result.confidence).toBe("low")
    expect(result.needsReview).toBe(true)
    expect(result.recommendedAction).toBeNull()
  })

  it("extracts additions as summary", () => {
    const result = noAiFallback(baseInput)
    expect(result.summary).toContain("New GPT-5 model")
  })

  it("uses readable title from changedText", () => {
    const result = noAiFallback(baseInput)
    expect(result.title).toBe("New GPT-5 model with 128k context window")
  })

  it("sets impactLevel based on classifier", () => {
    const securityInput: SummarizationInput = {
      ...baseInput,
      changedText: "+++ added\n+ Security vulnerability CVE-2024-1234 patched",
    }
    const result = noAiFallback(securityInput)
    expect(result.impactLevel).toBe("high")
  })

  it("sets low impact for minor changes", () => {
    const minorInput: SummarizationInput = {
      ...baseInput,
      changedText: "+++ added\n+ Fixed a minor typo in the docs",
    }
    const result = noAiFallback(minorInput)
    expect(result.impactLevel).toBe("low")
  })
})

describe("fillTemplate edge cases", () => {
  it("renders empty audience array as technical default", () => {
    const template = "Audience: [{{audience}}]"
    const input = { ...baseInput, audience: [] as string[] }
    const result = fillTemplate(template, input)
    expect(result).toBe("Audience: [technical]")
  })

  it("handles special characters in changedText", () => {
    const template = "Changed: {{changedText}}"
    const input = { ...baseInput, changedText: "Line with <html> & \"quotes\" and 'apostrophes'" }
    const result = fillTemplate(template, input)
    expect(result).toContain("<html>")
    expect(result).toContain("& \"quotes\"")
  })

  it("handles unicode in changedText", () => {
    const template = "Changed: {{changedText}}"
    const input = { ...baseInput, changedText: "日本語のテスト 🚀" }
    const result = fillTemplate(template, input)
    expect(result).toContain("日本語のテスト 🚀")
  })
})
