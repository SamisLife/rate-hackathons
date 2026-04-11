import { NextRequest, NextResponse } from "next/server";
import { goFetch } from "@/lib/goFetch";

const GO_BASE = process.env.GO_BASE_URL ?? "http://localhost:8080";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username") ?? "";
  try {
    const { res, data } = await goFetch(
      `${GO_BASE}/verify?username=${encodeURIComponent(username)}`,
      { signal: AbortSignal.timeout(15_000) },
    );
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach backend." },
      { status: 502 },
    );
  }
}
