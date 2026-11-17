import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { walletCampaignsEnabledForCafe } from "@/lib/wallet/campaign-access";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";
import { getWalletNotificationSettings, saveWalletNotificationSettings } from "@/lib/wallet/notification-settings";
import { updateGoogleWalletClass } from "@/lib/wallet/google";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const suffix = z.string().trim().max(100).refine(value => !/[\u0000-\u001f]/.test(value), "Use a single line of text.");
const allowedMaps = (u: URL) => u.protocol === "https:" && !u.username && !u.password && !u.port && ["maps.app.goo.gl","goo.gl","www.google.com","maps.google.com","google.com"].includes(u.hostname);
async function resolveMapsLink(link: string) {
 let u = new URL(link);
 for(let i=0;i<5;i++){
  if(!allowedMaps(u)) throw new Error("Use a Google Maps link.");
  const raw=decodeURIComponent(u.href);
  const m=raw.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ?? (u.searchParams.get("query") ?? u.searchParams.get("q") ?? "").match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  if(m){const latitude=Number(m[1]),longitude=Number(m[2]);if(Math.abs(latitude)<=90&&Math.abs(longitude)<=180)return {latitude,longitude};}
  if(u.hostname!=="maps.app.goo.gl"&&u.hostname!=="goo.gl") break;
  const r=await fetch(u,{redirect:"manual",signal:AbortSignal.timeout(5000)});
  const next=r.headers.get("location"); if(!next)break;u=new URL(next,u);
 }
 throw new Error("Could not find the exact business pin. Open Maps, select the pin and copy its full link.");
}
const schema = z.object({ cafeId: z.string().min(1).max(100), stampSuffix: suffix, rewardSuffix: suffix, resetSuffix: suffix.optional(),
  nearbyLocations: z.array(z.object({name:z.string().trim().min(1).max(80),mapsUrl:z.string().max(1200).optional(),latitude:z.number().finite().min(-90).max(90).nullable(),longitude:z.number().finite().min(-180).max(180).nullable(),message:suffix.min(1)}).strict()).max(10).optional(),
  nearbyEnabled: z.boolean().optional(), nearbyMessage: suffix.optional(),
  nearbyLatitude: z.number().finite().min(-90).max(90).nullable().optional(),
  nearbyLongitude: z.number().finite().min(-180).max(180).nullable().optional(),
  nearbyMaxDistance: z.number().int().min(50).max(1000).nullable().transform(value => value ?? 150).optional(),
}).strict();
async function handle(request: NextRequest) {
  const auth = await requireAuth(request.headers);
  if (!auth || auth.isCashier || !["CAFE_ADMIN", "SUPER_ADMIN"].includes(auth.user.role)) return json({ message: "Administrator access required." }, 403);
  if (!auth.isSuperAdmin) {
    const access = await requireActiveCafe(request.headers);
    if (!access.allowed) return json({ message: access.message }, access.status);
  }
  if (request.method === "POST" && request.headers.get("origin") !== request.nextUrl.origin) return json({ message: "Invalid request origin." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 16384) return json({ message: "Request too large." }, 413);
  const body = request.method === "POST" ? await request.json() : null;
  const cafeId = body?.cafeId ?? request.nextUrl.searchParams.get("cafeId");
  if (typeof cafeId !== "string" || (!auth.isSuperAdmin && cafeId !== auth.cafeId) || !walletCampaignsEnabledForCafe(cafeId)) return json({ message: "Wallet notification settings are available to the Loretto pilot only." }, 403);
  const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, isActive: true },  });
  if (!cafe) return json({ message: "Active business not found." }, 404);
  if (request.method === "POST") {
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ message: "Use up to 100 characters for each optional message. Only notification messages and nearby settings can be edited here." }, 400);
    if (!auth.isSuperAdmin && Object.keys(parsed.data).some(key => key.startsWith("nearby"))) return json({ message: "Location is managed by BeLoyal Studio." }, 403);
    const current = await getWalletNotificationSettings(cafeId);
    const submitted = { ...parsed.data };
    Reflect.deleteProperty(submitted, "cafeId");
    let locations;
    try { if(parsed.data.nearbyLocations) locations=await Promise.all(parsed.data.nearbyLocations.map(async l=>{const point=l.mapsUrl?await resolveMapsLink(l.mapsUrl):l;if(point.latitude==null||point.longitude==null)throw new Error("Add a Google Maps link.");return {...l,latitude:point.latitude,longitude:point.longitude};})); } catch(e){return json({message:e instanceof Error?e.message:"Invalid Maps link."},400);}
    const {nearbyLocations: _locations, ...rest}=submitted;
    void _locations;
    const settings = { ...current, ...rest, ...(locations ? {nearbyLocations:locations}: {}) };
    if (settings.nearbyEnabled && (settings.nearbyLocations ? settings.nearbyLocations.length === 0 : (settings.nearbyLatitude == null || settings.nearbyLongitude == null || !settings.nearbyMessage?.trim()))) return json({ message: "Add your business’s latitude, longitude and nearby message before enabling nearby reminders." }, 400);
    await saveWalletNotificationSettings(cafeId, settings);
    if (auth.isSuperAdmin && Object.keys(parsed.data).some(key => key.startsWith("nearby"))) await updateGoogleWalletClass(cafe, settings);
  }
  return json({ settings: await getWalletNotificationSettings(cafeId), rewardName: cafe.rewardName, target: getLoyaltyProgressTarget(cafe) });
}
async function respond(request: NextRequest) {
  try { return await handle(request); }
  catch { return json({ message: "Could not load or save Wallet notification settings. Try again." }, 500); }
}
export const GET = respond;
export const POST = respond;
