import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const db = await readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    username: user.username,
    devpostUsername: user.devpostUsername,
    createdAt: user.createdAt,
  });
}
