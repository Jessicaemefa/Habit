import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

// Module-level singleton — Vercel reuses function instances so this
// connection is reused across requests rather than reconnecting every time.
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    });
    redis.on("error", () => {
      // silence connection errors — app falls back to localStorage
    });
  }
  return redis;
}

const userKey = (name: string) => `ht:${name.toLowerCase().trim()}`;

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user")?.trim();
  if (!user) return NextResponse.json({ data: null });
  try {
    const r = getRedis();
    if (!r) return NextResponse.json({ data: null });
    const raw = await r.get(userKey(user));
    const data = raw ? (JSON.parse(raw) as unknown) : null;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { user?: string; data?: unknown };
    const user = body.user?.trim();
    if (!user || !body.data) return NextResponse.json({ ok: false });
    const r = getRedis();
    if (!r) return NextResponse.json({ ok: false });
    await r.set(userKey(user), JSON.stringify(body.data));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
