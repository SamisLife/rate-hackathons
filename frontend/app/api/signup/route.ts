import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";

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
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: { token?: string; username?: string; password?: string };
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

  // Check token JTI not already used
  const jtiCheck = await pool.query("SELECT 1 FROM users WHERE token_jti = $1", [payload.jti]);
  if (jtiCheck.rowCount) {
    return NextResponse.json({ error: "This token has already been used. Please re-verify your Devpost to get a new one." }, { status: 409 });
  }

  // Check username uniqueness
  const usernameCheck = await pool.query("SELECT 1 FROM users WHERE LOWER(username) = LOWER($1)", [trimmedUsername]);
  if (usernameCheck.rowCount) {
    return NextResponse.json({ error: "That username is already taken. Please choose another." }, { status: 409 });
  }

  // Check Devpost uniqueness
  const devpostCheck = await pool.query("SELECT 1 FROM users WHERE LOWER(devpost_username) = LOWER($1)", [payload.sub]);
  if (devpostCheck.rowCount) {
    return NextResponse.json({ error: "A HackRank account is already linked to this Devpost profile." }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const result = await pool.query(
    `INSERT INTO users (id, username, devpost_username, password_hash, created_at, token_jti)
     VALUES ($1, $2, $3, $4, NOW(), $5)
     RETURNING username, devpost_username, created_at`,
    [id, trimmedUsername, payload.sub, hashPassword(password), payload.jti],
  );
  const user = result.rows[0];

  return NextResponse.json(
    {
      ok: true,
      user: {
        id,
        username: user.username,
        devpostUsername: user.devpost_username,
        createdAt: user.created_at,
      },
    },
    { status: 201 },
  );
}
