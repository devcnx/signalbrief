import * as cheerio from "cheerio"

export type CleanResult = {
  cleanedText: string
  title: string | null
  error: string | null
}

const REMOVED_TAGS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "aside",
  "svg",
  "iframe",
  "form",
]

const REMOVED_SELECTORS = [
  "[role=navigation]",
  "[role=banner]",
  "[role=contentinfo]",
  ".cookie-banner",
  ".cookie-notice",
  ".sidebar",
  ".nav",
  ".menu",
  ".breadcrumb",
  ".skip-link",
  "#skip-link",
]

export function cleanHtml(rawHtml: string): CleanResult {
  try {
    const $ = cheerio.load(rawHtml)

    const title = $("title").text().trim() || null

    for (const tag of REMOVED_TAGS) {
      $(tag).remove()
    }

    for (const selector of REMOVED_SELECTORS) {
      $(selector).remove()
    }

    const mainContent =
      $("main").text().trim() ||
      $("article").text().trim() ||
      $("body").text().trim()

    const cleanedText = mainContent
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim()

    return {
      cleanedText,
      title,
      error: cleanedText.length === 0 ? "No content extracted" : null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parsing error"
    return {
      cleanedText: "",
      title: null,
      error: message,
    }
  }
}