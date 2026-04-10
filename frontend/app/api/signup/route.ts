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

async function writeDb(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

type HR1Payload = {
  sub: string;
  iat: number;
  jti: string;
  iss: string;
};

function decodeHR1Token(token: string): HR1Payload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 4 || parts[0] !== "hr1") return null;

    const b64url = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(b64url(parts[2]), "base64").toString("utf8")) as HR1Payload;

    if (payload.iss !== "hackrank") return null;

    const ageSec = Math.floor(Date.now() / 1000) - payload.iat;
    if (ageSec < 0 || ageSec > 1800) return null;

    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  // PoC only: replace with bcrypt/argon2 before production use.
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: {
    token?: string;
    username?: string;
    password?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { token, username, password } = body;

  if (!token || !username || !password) {
    return NextResponse.json({ error: "token, username, and password are all required." }, { status: 400 });
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 2 || trimmedUsername.length > 32) {
    return NextResponse.json({ error: "Username must be 2–32 characters." }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    return NextResponse.json({ error: "Username may only contain letters, numbers, _ and -." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const payload = decodeHR1Token(token);
  if (!payload) {
    return NextResponse.json({ error: "Token is invalid or has expired. Please re-verify your Devpost." }, { status: 401 });
  }

  const db = await readDb();

  if (db.users.some((u) => u.tokenJti === payload.jti)) {
    return NextResponse.json({ error: "This token has already been used. Please re-verify your Devpost to get a new one." }, { status: 409 });
  }

  if (db.users.some((u) => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
    return NextResponse.json({ error: "That username is already taken. Please choose another." }, { status: 409 });
  }

  if (db.users.some((u) => u.devpostUsername.toLowerCase() === payload.sub.toLowerCase())) {
    return NextResponse.json({ error: "A HackRank account is already linked to this Devpost profile." }, { status: 409 });
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    username: trimmedUsername,
    devpostUsername: payload.sub,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    tokenJti: payload.jti,
  };

  db.users.push(newUser);
  await writeDb(db);

  return NextResponse.json(
    {
      ok: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        devpostUsername: newUser.devpostUsername,
        createdAt: newUser.createdAt,
      },
    },
    { status: 201 },
  );
}