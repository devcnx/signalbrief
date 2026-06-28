import crypto from "crypto"

export type FetchResult = {
  ok: boolean
  statusCode: number
  rawHtml: string
  errorMessage: string | null
}

const FETCH_TIMEOUT_MS = 15000
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const USER_AGENT = "SignalBrief/0.1 (local documentation monitor)"

export async function fetchSource(url: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    })

    if (!res.ok) {
      return {
        ok: false,
        statusCode: res.status,
        rawHtml: "",
        errorMessage: `HTTP ${res.status} ${res.statusText}`,
      }
    }

    const contentLength = parseInt(res.headers.get("content-length") || "0", 10)
    if (contentLength > MAX_RESPONSE_BYTES) {
      return {
        ok: false,
        statusCode: res.status,
        rawHtml: "",
        errorMessage: `Response too large (${contentLength} bytes, max ${MAX_RESPONSE_BYTES})`,
      }
    }

    const rawHtml = await res.text()

    if (rawHtml.length > MAX_RESPONSE_BYTES) {
      return {
        ok: false,
        statusCode: res.status,
        rawHtml: "",
        errorMessage: `Response too large (${rawHtml.length} chars, max ${MAX_RESPONSE_BYTES})`,
      }
    }

    return {
      ok: true,
      statusCode: res.status,
      rawHtml,
      errorMessage: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error"
    return {
      ok: false,
      statusCode: 0,
      rawHtml: "",
      errorMessage: message,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function generateContentHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex")
}