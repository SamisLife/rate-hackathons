import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

type User = {
  id: string;
  username: string;
  devpostUsername: string;
  passwordHash: string;
  createdAt: string;
  tokenJti: string;
};

type Db = { users: User[] };

const DB_PATH = path.join(process.cwd(), "data", "users.json");

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as Db;
  } catch {
    return { users: [] };
  }
}

function hashPassword(password: string): string {
  // PoC only: replace with bcrypt/argon2 before production use.
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "username and password are required." }, { status: 400 });
  }

  const db = await readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
  );

  if (!user || user.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      username: user.username,
      devpostUsername: user.devpostUsername,
      createdAt: user.createdAt,
    },
  });
}
