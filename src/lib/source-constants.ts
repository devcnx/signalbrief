export const SOURCE_TYPES = [
  { value: "changelog", label: "Changelog" },
  { value: "release_notes", label: "Release Notes" },
  { value: "docs_page", label: "Docs Page" },
  { value: "rss", label: "RSS Feed" },
  { value: "github_release", label: "GitHub Release" },
] as const

export const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const

export const CATEGORIES = [
  { value: "api", label: "API" },
  { value: "platform", label: "Platform" },
  { value: "enterprise_ai", label: "Enterprise AI" },
  { value: "research", label: "Research" },
  { value: "tooling", label: "Tooling" },
  { value: "safety", label: "Safety" },
  { value: "other", label: "Other" },
] as const
