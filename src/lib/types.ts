export type SourceType =
  | "docs_page"
  | "changelog"
  | "release_notes"
  | "rss"
  | "github_release"

export type Priority = "high" | "medium" | "low"
export type RunStatus = "pending" | "running" | "completed" | "completed_with_errors" | "failed"
export type SnapshotStatus = "success" | "failed" | "skipped"
export type Significance = "high" | "medium" | "low" | "noise"
export type ImpactLevel = "high" | "medium" | "low"
export type Confidence = "high" | "medium" | "low"

export type SummarizationInput = {
  provider: string
  sourceName: string
  sourceUrl: string
  category: string
  priority: Priority
  changedText: string
  previousContext?: string
  audience?: string[]
}

export type NewsletterItemDraft = {
  title: string
  provider: string
  category: string
  impactLevel: ImpactLevel
  summary: string
  whyItMatters: string
  recommendedAction?: string | null
  sourceUrl: string
  confidence: Confidence
  needsReview: boolean
}

export interface Summarizer {
  summarizeChange(input: SummarizationInput): Promise<NewsletterItemDraft>
}
