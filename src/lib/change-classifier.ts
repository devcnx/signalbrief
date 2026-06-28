import type { Significance } from "@/lib/types"

const HIGH_IMPACT_PATTERNS = [
  /new\s+(model|api|capability|platform|service)/i,
  /(deprecat|remov|sunset|end[\s-]of[\s-]life)/i,
  /(breaking|backward[\s-]incompatib)/i,
  /(securit|vulnerability|exploit|patch|CVE-\d)/i,
  /(pric|pricing|limit|rate[\s-]limit|quota)/i,
  /(complianc|regulat|gdpr|hipaa|soc2|privacy)/i,
  /(enterprise|enterprise[\s-]feature)/i,
]

const MEDIUM_IMPACT_PATTERNS = [
  /(sdk|library|package)\s+(update|release|version)/i,
  /(documentation|doc|guide|tutorial)\s+(add|updat|new)/i,
  /(preview|beta|early[\s-]access|experimental)/i,
  /(clarif|clarification|behavior)/i,
  /(integration|integrat)/i,
]

const LOW_IMPACT_PATTERNS = [
  /minor\s+(update|fix|improve)/i,
  /(clarif|clarification)/i,
  /small\s+(change|update|tweak)/i,
  /(example|sample)/i,
]

const NOISE_PATTERNS = [
  /footer|navigation|menu|sidebar/i,
  /(last\s+updated|last\s+modified|updated:\s+\w+)/i,
  /copyright|all rights reserved/i,
  /\d{4}-\d{2}-\d{2}/,
  /(loading\.\.\.|please wait)/i,
]

export function classifyChange(diffText: string): Significance {
  const text = diffText.slice(0, 500)

  for (const [patterns, significance] of [
    [HIGH_IMPACT_PATTERNS, "high"],
    [MEDIUM_IMPACT_PATTERNS, "medium"],
    [LOW_IMPACT_PATTERNS, "low"],
  ] as const) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return significance as Significance
    }
  }

  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(text)) return "noise"
  }

  if (diffText.length > 200) return "medium"

  return "low"
}
