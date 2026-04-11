/**
 * Fetch from the Go backend and always return parsed JSON.
 * If the response is not JSON (e.g. Render's HTML spin-up page), throws a
 * descriptive error instead of a cryptic "Unexpected token '<'" parse failure.
 */
export async function goFetch(url: string, init?: RequestInit): Promise<{ res: Response; data: unknown }> {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Backend returned non-JSON (status ${res.status}). ` +
      `Is GO_BASE_URL correct? Preview: ${text.slice(0, 120)}`,
    );
  }
  const data = await res.json();
  return { res, data };
}
