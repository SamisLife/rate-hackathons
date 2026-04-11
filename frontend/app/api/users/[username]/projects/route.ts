import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const GO_BASE = process.env.GO_BASE_URL ?? "http://localhost:8080";

type ScrapedProject = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  imageUrl: string;
  isWinner: boolean;
  hackathonUrl: string;
  hackathonName: string;
  prizeCategory: string;
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
      "SELECT projects, cached_at FROM projects_cache WHERE username = LOWER($1)",
      [username],
    );
    if (cached.rowCount) {
      return NextResponse.json({
        projects: cached.rows[0].projects,
        cachedAt: cached.rows[0].cached_at,
      });
    }
  }

  // Fetch from Go scraper
  let scraped: ScrapedProject[];
  try {
    const res = await fetch(
      `${GO_BASE}/projects?username=${encodeURIComponent(devpostUsername)}`,
      { signal: AbortSignal.timeout(60_000) },
    );
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      return NextResponse.json({ error: body.error ?? "Scraper error." }, { status: 502 });
    }
    const data = (await res.json()) as { projects: ScrapedProject[] };
    scraped = data.projects;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach scraper." },
      { status: 502 },
    );
  }

  // Upsert into DB
  await pool.query(
    `INSERT INTO projects_cache (username, cached_at, projects)
     VALUES (LOWER($1), NOW(), $2)
     ON CONFLICT (username) DO UPDATE
       SET cached_at = EXCLUDED.cached_at,
           projects  = EXCLUDED.projects`,
    [username, JSON.stringify(scraped)],
  );

  return NextResponse.json({ projects: scraped, cachedAt: new Date().toISOString() });
}
