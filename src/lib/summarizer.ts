import fs from "fs/promises"
import path from "path"
import type { SummarizationInput, NewsletterItemDraft, Summarizer } from "./types"
import { buildReadableTitle, buildReadableSummary } from "./readability"
import { getWhyItMatters } from "./newsletter-builder"
import { classifyChange } from "./change-classifier"
import { parseChangedText } from "./readability"

const PROMPT_TEMPLATE_PATH = path.join(process.cwd(), "prompts", "summarize-change.md")

const PROVIDER_CONFIG: Record<string, { baseUrl: string; model: string; envKey: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-20250514",
    envKey: "ANTHROPIC_API_KEY",
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.2",
    envKey: "",
  },
}

function getProvider(): string | null {
  const provider = process.env.AI_PROVIDER?.toLowerCase().trim()
  if (!provider || provider === "none" || provider === "") return null
  if (!(provider in PROVIDER_CONFIG)) return null
  return provider
}

function getApiKey(provider: string): string | null {
  const config = PROVIDER_CONFIG[provider]
  if (!config.envKey) return null
  return process.env[config.envKey] || null
}

function hasAiProvider(): boolean {
  const provider = getProvider()
  if (!provider) return false
  const config = PROVIDER_CONFIG[provider]
  if (!config.envKey) return true
  return !!getApiKey(provider)
}

async function loadPromptTemplate(): Promise<string> {
  return fs.readFile(PROMPT_TEMPLATE_PATH, "utf-8")
}

function fillTemplate(template: string, input: SummarizationInput): string {
  return template
    .replace(/\{\{provider\}\}/g, input.provider)
    .replace(/\{\{sourceName\}\}/g, input.sourceName)
    .replace(/\{\{sourceUrl\}\}/g, input.sourceUrl)
    .replace(/\{\{category\}\}/g, input.category)
    .replace(/\{\{priority\}\}/g, input.priority)
    .replace(/\{\{audience\}\}/g, input.audience?.join(", ") || "technical")
    .replace(/\{\{changedText\}\}/g, input.changedText)
}

type AiResponse = {
  title?: string
  provider?: string
  category?: string
  impactLevel?: string
  summary?: string
  whyItMatters?: string
  recommendedAction?: string | null
  sourceUrl?: string
  confidence?: string
  needsReview?: boolean
}

function validateOutput(
  raw: AiResponse,
  input: SummarizationInput
): NewsletterItemDraft | null {
  if (typeof raw !== "object" || raw === null) return null
  if (typeof raw.summary !== "string" || raw.summary.length === 0) return null

  const validImpact = ["high", "medium", "low"]
  const impactLevel = validImpact.includes(raw.impactLevel || "") ? raw.impactLevel! : "low"

  const validConfidence = ["high", "medium", "low"]
  const confidence = validConfidence.includes(raw.confidence || "") ? raw.confidence! : "low"

  return {
    title: typeof raw.title === "string" && raw.title.length > 0
      ? raw.title
      : buildReadableTitle(input.changedText, input.provider),
    provider: input.provider,
    category: typeof raw.category === "string" ? raw.category : input.category,
    impactLevel: impactLevel as NewsletterItemDraft["impactLevel"],
    summary: raw.summary,
    whyItMatters: typeof raw.whyItMatters === "string" && raw.whyItMatters.length > 0
      ? raw.whyItMatters
      : getWhyItMatters(impactLevel, "updated"),
    recommendedAction: raw.recommendedAction ?? null,
    sourceUrl: input.sourceUrl,
    confidence: confidence as NewsletterItemDraft["confidence"],
    needsReview: raw.needsReview ?? true,
  }
}

async function callOpenAICompatible(
  provider: string,
  prompt: string
): Promise<AiResponse> {
  const config = PROVIDER_CONFIG[provider]
  const apiKey = getApiKey(provider)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (provider === "anthropic") {
    headers["x-api-key"] = apiKey || ""
    headers["anthropic-version"] = "2023-06-01"
  } else {
    headers["Authorization"] = `Bearer ${apiKey || ""}`
  }

  const body = provider === "anthropic"
    ? JSON.stringify({
        model: config.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      })
    : JSON.stringify({
        model: config.model,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      })

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`AI provider ${provider} returned ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()

  let content: string
  if (provider === "anthropic") {
    content = data.content?.[0]?.text || ""
  } else {
    content = data.choices?.[0]?.message?.content || ""
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON")
  }

  return JSON.parse(jsonMatch[0]) as AiResponse
}

function noAiFallback(input: SummarizationInput): NewsletterItemDraft {
  const { additions } = parseChangedText(input.changedText)
  const readable = additions.length > 0
    ? additions.join("\n")
    : buildReadableSummary(input.changedText)

  const significance = classifyChange(
    input.changedText.replace(/^- .*/gm, "").replace(/^\+ /gm, ""),
    input.changedText.replace(/^\+ .*/gm, "").replace(/^- /gm, "")
  )

  return {
    title: buildReadableTitle(input.changedText, input.provider),
    provider: input.provider,
    category: input.category,
    impactLevel: significance === "high" || significance === "medium"
      ? significance
      : "low",
    summary: readable.length > 0 ? readable : buildReadableSummary(input.changedText),
    whyItMatters: getWhyItMatters(significance, "updated"),
    recommendedAction: null,
    sourceUrl: input.sourceUrl,
    confidence: "low",
    needsReview: true,
  }
}

export async function summarizeChange(input: SummarizationInput): Promise<NewsletterItemDraft> {
  if (!hasAiProvider()) {
    return noAiFallback(input)
  }

  const provider = getProvider()!

  try {
    const template = await loadPromptTemplate()
    const prompt = fillTemplate(template, input)
    const raw = await callOpenAICompatible(provider, prompt)
    const validated = validateOutput(raw, input)
    if (validated) return validated
    return noAiFallback(input)
  } catch {
    return noAiFallback(input)
  }
}

export const aiSummarizer: Summarizer = {
  summarizeChange,
}

export {
  getProvider,
  getApiKey,
  hasAiProvider,
  noAiFallback,
  fillTemplate,
  validateOutput,
}
