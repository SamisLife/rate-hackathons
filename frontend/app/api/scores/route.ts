import { NextResponse } from "next/server";

const GO_BASE = process.env.GO_BASE_URL ?? "http://localhost:8080";

export async function GET() {
  try {
    const res = await fetch(`${GO_BASE}/scores`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return NextResponse.json({ scores: [] });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ scores: [] });
  }
}
