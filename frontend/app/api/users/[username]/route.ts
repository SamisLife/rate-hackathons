import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const result = await pool.query(
    "SELECT username, devpost_username, created_at FROM users WHERE LOWER(username) = LOWER($1)",
    [username],
  );

  if (!result.rowCount) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const user = result.rows[0];
  return NextResponse.json({
    username: user.username,
    devpostUsername: user.devpost_username,
    createdAt: user.created_at,
  });
}
