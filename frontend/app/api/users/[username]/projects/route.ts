import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

type CacheEntry = {
  cachedAt: string;
  projects: ScrapedProject[];
};

type Cache = Record<string, CacheEntry>;

type UserDb = {
  users: {
    username: string;
    devpostUsername: string;
    passwordHash: string;
    createdAt: string;
    tokenJti: string;
  }[];
};

const USERS_PATH = path.join(process.cwd(), "data", "users.json");
const CACHE_PATH = path.join(process.cwd(), "data", "projects_cache.json");
const GO_BASE    = "http://localhost:8080";

async function readUsers(): Promise<UserDb> {
  try { return JSON.parse(await fs.readFile(USERS_PATH, "utf8")) as UserDb; }
  catch { return { users: [] }; }
}

async function readCache(): Promise<Cache> {
  try { return JSON.parse(await fs.readFile(CACHE_PATH, "utf8")) as Cache; }
  catch { return {}; }
}

async function writeCache(cache: Cache): Promise<void> {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  const db = await readUsers();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const cache = await readCache();
  const entry = cache[username.toLowerCase()];

  if (entry && !refresh) {
    return NextResponse.json({ projects: entry.projects, cachedAt: entry.cachedAt });
  }

  let scraped: ScrapedProject[];
  try {
    const res = await fetch(
      `${GO_BASE}/projects?username=${encodeURIComponent(user.devpostUsername)}`,
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

  const newEntry: CacheEntry = { cachedAt: new Date().toISOString(), projects: scraped };
  cache[username.toLowerCase()] = newEntry;
  await writeCache(cache);

  return NextResponse.json({ projects: scraped, cachedAt: newEntry.cachedAt });
}
