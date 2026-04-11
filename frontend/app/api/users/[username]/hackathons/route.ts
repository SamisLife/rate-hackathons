import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const GO_BASE = process.env.GO_BASE_URL ?? "http://localhost:8080";

type ScrapedHackathon = {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  description: string;
  prize: string;
  dateRange: string;
  participants: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  // Resolve devpost username
  const userResult = await pool.query(
    "SELECT devpost_username FROM users WHERE LOWER(username) = LOWER($1)",
    [username],
  );
  if (!userResult.rowCount) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const devpostUsername = userResult.rows[0].devpost_username as string;

  // Return cached data if fresh enough
  if (!refresh) {
    const cached = await pool.query(
      "SELECT hackathons, cached_at FROM attendance_cache WHERE username = LOWER($1)",
      [username],
    );
    if (cached.rowCount) {
      return NextResponse.json({
        hackathons: cached.rows[0].hackathons,
        cachedAt: cached.rows[0].cached_at,
      });
    }
  }

  // Fetch from Go scraper
  let scraped: ScrapedHackathon[];
  try {
    const res = await fetch(
      `${GO_BASE}/hackathons?username=${encodeURIComponent(devpostUsername)}`,
      { signal: AbortSignal.timeout(20_000) },
    );
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      return NextResponse.json({ error: body.error ?? "Scraper error." }, { status: 502 });
    }
    const data = (await res.json()) as { hackathons: ScrapedHackathon[] };
    scraped = data.hackathons;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach scraper." },
      { status: 502 },
    );
  }

  // Upsert into DB
  await pool.query(
    `INSERT INTO attendance_cache (username, devpost_username, cached_at, hackathons)
     VALUES (LOWER($1), $2, NOW(), $3)
     ON CONFLICT (username) DO UPDATE
       SET devpost_username = EXCLUDED.devpost_username,
           cached_at        = EXCLUDED.cached_at,
           hackathons       = EXCLUDED.hackathons`,
    [username, devpostUsername, JSON.stringify(scraped)],
  );

  return NextResponse.json({ hackathons: scraped, cachedAt: new Date().toISOString() });
}
