import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";

function hashPassword(password: string): string {
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

  const result = await pool.query(
    "SELECT username, devpost_username, password_hash, created_at FROM users WHERE LOWER(username) = LOWER($1)",
    [username.trim()],
  );

  const user = result.rows[0];
  if (!user || user.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      username: user.username,
      devpostUsername: user.devpost_username,
      createdAt: user.created_at,
    },
  });
}
