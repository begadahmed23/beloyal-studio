import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { prisma } from "@/lib/prisma";
import { walletUpdatesEnabled } from "@/lib/wallet/config";
import { getWalletMessage, setWalletMessage } from "@/lib/wallet/messages";
import { notifyWalletMember, passKey, walletRedis } from "@/lib/wallet/updates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
async function handle(request: NextRequest) {
  if (!await requireSuperAdmin(request.headers)) return json({ message: "Super-admin access required." }, 403);
  if (request.method === "POST" && request.headers.get("origin") !== request.nextUrl.origin) return json({ message: "Invalid origin." }, 403);
  if (!walletUpdatesEnabled()) return json({ message: "Wallet updates are disabled." }, 503);
  const body = request.method === "POST" ? await request.json() : null;
  const token = body?.token ?? request.nextUrl.searchParams.get("token");
  if (typeof token !== "string" || !/^[a-f0-9]{48}$/i.test(token)) return json({ message: "Enter a valid customer card link." }, 400);
  const member = await prisma.customer.findFirst({ where: { publicToken: token, cafe: { isActive: true } },
    select: { id: true, name: true, memberNumber: true, cafe: { select: { name: true, slug: true } } } });
  if (!member) return json({ message: "Card not found." }, 404);
  // This pilot is deliberately restricted to Loretto, one card at a time.
  if (!/loretto/i.test(member.cafe.slug + member.cafe.name)) return json({ message: "This pilot is for Loretto cards only." }, 400);
  const registrations = await walletRedis().hgetall<Record<string, string>>(passKey(member.id));
  const devices = Object.keys(registrations ?? {}).length;
  if (request.method === "GET") return json({ name: member.name, memberNumber: member.memberNumber, business: member.cafe.name, devices, message: (await getWalletMessage(member.id))?.text ?? null });
  if (!devices) return json({ message: "No Wallet devices registered. Add this card to Apple Wallet first." }, 409);
  const lock = `${passKey(member.id)}:message-test-lock`;
  if (!await walletRedis().set(lock, "1", { nx: true, ex: 60 })) return json({ message: "Wait one minute before another test." }, 429);
  const text = "BeLoyal test — your Loretto card is connected ☕";
  if ((await getWalletMessage(member.id))?.text === text) return json({ message: "This test message is already on the card. No duplicate notification sent." }, 409);
  await setWalletMessage(member.id, text);
  const result = await notifyWalletMember(member.id);
  return json({ message: `Test saved. Apple accepted ${result?.accepted ?? 0} of ${devices} update request(s). Check your iPhone; acceptance does not confirm a visible notification.`, result });
}
export async function GET(request: NextRequest) { try { return await handle(request); } catch { return json({ message: "Could not check Wallet registration." }, 500); } }
export async function POST(request: NextRequest) { try { return await handle(request); } catch { return json({ message: "Test could not be completed. Check the card before retrying." }, 500); } }
