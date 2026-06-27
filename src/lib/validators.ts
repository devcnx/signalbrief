import { SOURCE_TYPES, PRIORITIES, CATEGORIES } from "./source-constants"

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

const validTypes: string[] = SOURCE_TYPES.map((t) => t.value)
const validPriorities: string[] = PRIORITIES.map((p) => p.value)
const validCategories: string[] = CATEGORIES.map((c) => c.value)

export function validateSourceInput(data: Record<string, unknown>) {
  const errors: Record<string, string> = {}

  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.name = "Name is required"
  }

  if (!data.provider || typeof data.provider !== "string" || data.provider.trim().length === 0) {
    errors.provider = "Provider is required"
  }

  if (!data.url || typeof data.url !== "string" || !isValidUrl(data.url)) {
    errors.url = "A valid URL (http/https) is required"
  }

  if (!data.type || !validTypes.includes(data.type as string)) {
    errors.type = "Type must be one of: " + validTypes.join(", ")
  }

  if (!data.category || !validCategories.includes(data.category as string)) {
    errors.category = "Category must be one of: " + validCategories.join(", ")
  }

  if (!data.priority || !validPriorities.includes(data.priority as string)) {
    errors.priority = "Priority must be one of: " + validPriorities.join(", ")
  }

  return errors
}
