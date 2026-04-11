import { NextRequest, NextResponse } from "next/server";
import { goFetch } from "@/lib/goFetch";

const GO_BASE = process.env.GO_BASE_URL ?? "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { res, data } = await goFetch(`${GO_BASE}/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach backend." },
      { status: 502 },
    );
  }
}
