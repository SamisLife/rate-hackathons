import { NextResponse } from "next/server";
import { goFetch } from "@/lib/goFetch";

const GO_BASE = process.env.GO_BASE_URL ?? "http://localhost:8080";

export async function GET() {
  try {
    const { data } = await goFetch(`${GO_BASE}/scores`, {
      signal: AbortSignal.timeout(5_000),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ scores: [] });
  }
}
