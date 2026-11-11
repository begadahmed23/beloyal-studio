import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPublicRateLimit, publicApiRateLimiters } from "@/lib/public-api-security";
import { createAppleWalletPass } from "@/lib/wallet/apple";
import { validWalletAuth, walletUpdatesEnabled } from "@/lib/wallet/config";
import { deviceKey, walletRedis, registerWalletDevice, unregisterWalletDevice } from "@/lib/wallet/updates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const reply = (status: number) => new NextResponse(null, { status, headers });
const identifier = (value: string) => /^[a-z0-9_-]{1,200}$/i.test(value);
// Bump when pass artwork changes, so installed cards can retrieve a new design.
const ARTWORK_VERSION = Date.UTC(2026, 10, 11, 0);
const select = { id: true, publicToken: true, memberNumber: true, name: true, stamps: true,
  rewardEarnedAt: true, updatedAt: true,
  cafe: { select: { name: true, slug: true, theme: true, businessType: true,
    rewardTarget: true, rewardName: true, primaryColor: true, backgroundColor: true, updatedAt: true } } } as const;

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    if (!walletUpdatesEnabled()) return reply(503);
    const limited = await applyPublicRateLimit(request, publicApiRateLimiters.card, "wallet-service");
    if (limited) return limited;
    const { path } = await context.params;
    const method = request.method;
    // Wallet diagnostics may contain bearer tokens. Discard without logging the body.
    if (path.length === 1 && path[0] === "log" && method === "POST") return reply(200);
    const registering = path.length === 5 && path[0] === "devices" && path[2] === "registrations";
    const listing = path.length === 4 && path[0] === "devices" && path[2] === "registrations";
    const downloading = path.length === 3 && path[0] === "passes";
    const type = downloading ? path[1] : path[3];
    if ((!registering && !listing && !downloading) || type !== process.env.APPLE_WALLET_PASS_TYPE_ID) return reply(404);
    if (listing) {
      if (method !== "GET" || !identifier(path[1])) return reply(400);
      // Per Apple's protocol this endpoint uses the opaque device ID, not ApplePass auth.
      const ids = await walletRedis().smembers<string[]>(deviceKey(path[1]));
      if (!ids.length) return reply(204);
      const since = request.nextUrl.searchParams.get("passesUpdatedSince");
      if (since && !/^\d{1,16}$/.test(since)) return reply(400);
      const members = await prisma.customer.findMany({ where: { id: { in: ids }, cafe: { isActive: true } },
        select: { id: true, updatedAt: true, cafe: { select: { updatedAt: true } } } });
      const version = (member: typeof members[number]) => Math.max(ARTWORK_VERSION, member.updatedAt.getTime(), member.cafe.updatedAt.getTime());
      const changed = members.filter((member) => !since || version(member) > Number(since));
      if (!changed.length) return reply(204);
      return NextResponse.json({ serialNumbers: changed.map((member) => member.id),
        lastUpdated: String(Math.max(...members.map(version))) }, { headers });
    }
    const serial = downloading ? path[2] : path[4];
    if (!identifier(serial) || (registering && !identifier(path[1]))) return reply(400);
    if (!validWalletAuth(serial, request.headers.get("authorization"))) return reply(401);
    const member = await prisma.customer.findFirst({ where: { id: serial, cafe: { isActive: true } }, select });
    if (!member) return reply(404);
    if (registering) {
      if (method === "DELETE") { await unregisterWalletDevice(path[1], serial); return reply(200); }
      if (method !== "POST") return reply(405);
      if (Number(request.headers.get("content-length") || 0) > 2048) return reply(413);
      // Read with a byte cap, including chunked requests.
      const reader = request.body?.getReader();
      if (!reader) return reply(400);
      let size = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2048) { await reader.cancel(); return reply(413); }
        chunks.push(value);
      }
      let body: { pushToken?: unknown };
      try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { return reply(400); }
      if (!body || typeof body.pushToken !== "string" || !/^[a-f0-9]{32,256}$/i.test(body.pushToken)) return reply(400);
      const added = await registerWalletDevice(path[1], serial, body.pushToken);
      return reply(added ? 201 : 200);
    }
    if (method !== "GET") return reply(405);
    const modified = Math.max(ARTWORK_VERSION, member.updatedAt.getTime(), member.cafe.updatedAt.getTime());
    const since = Date.parse(request.headers.get("if-modified-since") ?? "");
    // Strict comparison avoids suppressing updates made in the same second.
    if (Number.isFinite(since) && modified < since) return reply(304);
    const pass = await createAppleWalletPass(member);
    return new NextResponse(new Uint8Array(pass), { headers: { ...headers,
      "Content-Type": "application/vnd.apple.pkpass", "Last-Modified": new Date(modified).toUTCString() } });
  } catch {
    console.error("Wallet web service request failed.");
    return reply(500);
  }
}
export const GET = handler;
export const POST = handler;
export const DELETE = handler;
