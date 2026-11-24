import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveCafe } from "@/lib/require-active-cafe";
import { applyPublicRateLimit, publicApiRateLimiters } from "@/lib/public-api-security";
import { activeRewardWhere, pointsEntrySchema, recordPointsEntry } from "@/lib/business/points-ledger";
import { earningRateSchema, rewardCostSchema } from "@/lib/business/points";
import { StoreCapacityError, withStoreCapacity } from "@/lib/business/store-capacity";
import { walletPassTypesForBusiness, walletUpdatesEnabled } from "@/lib/wallet/config";
import { googleWalletHasUsers, googleWalletEnabled } from "@/lib/wallet/google";
import { passKey, walletRedis, scheduleBusinessWalletUpdate, scheduleWalletUpdate } from "@/lib/wallet/updates";

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "private, no-store" },
});

const rewardInput = z.object({
  action: z.literal("reward"),
  id: z.string().max(100).optional(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(600),
  conditions: z.string().trim().max(1000),
  cost: rewardCostSchema,
  photoUrl: z.url().nullable(),
  enabled: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
  locationIds: z.array(z.string().max(100)).min(1).max(100),
});

const adminInput = z.discriminatedUnion("action", [
  rewardInput,
  z.object({ action: z.literal("rate"), rate: earningRateSchema }),
  z.object({ action: z.literal("archive"), id: z.string().max(100) }),
]);

function rewardPhotoStoreId() {
  return process.env.BLOB_PUBLIC_STORE_ID?.trim() || process.env.BOLB_PUBLIC_STORE_ID?.trim();
}

async function accessPoints(request: NextRequest) {
  const access = await requireActiveCafe(request.headers);
  if (!access.allowed) return json({ message: access.message }, access.status);
  const { cafe, cafeId, user } = access.authData;
  if (!cafeId || cafe?.loyaltyMode !== "POINTS" || (user.role !== "CASHIER" && user.role !== "CAFE_ADMIN")) {
    return json({ message: "Points loyalty access required." }, 403);
  }
  return { cafe, cafeId, user, admin: user.role === "CAFE_ADMIN" };
}

export async function GET(request: NextRequest) {
  const access = await accessPoints(request);
  if (access instanceof NextResponse) return access;
  const { cafe, cafeId, user, admin } = access;
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const checkout = request.nextUrl.searchParams.get("checkout") === "1";
  const customerId = request.nextUrl.searchParams.get("customer")?.slice(0, 100);
  const token = search.match(/^(?:BL:|https?:\/\/[^/]+\/card\/)?([a-f0-9]{48})\/?$/i)?.[1];
  const digits = search.replace(/[^0-9]/g, "");
  const locations = await prisma.cafeLocation.findMany({
    where: { cafeId, archivedAt: null, ...(!admin && { id: user.cashierLocationId ?? "" }) },
    select: { id: true, name: true }, orderBy: { name: "asc" },
  });
  const matchedCustomers = {
    cafeId,
    ...(customerId ? { id: customerId } : token ? { publicToken: token } : search ? {
      OR: [{ memberNumber: { equals: search, mode: "insensitive" as const } },
        { name: { contains: search, mode: "insensitive" as const } },
        ...(/^[+\d -]+$/.test(search) && digits.length >= 5 ? [{ phone: { endsWith: digits } }] : [])],
    } : {}),
  };
  if (request.nextUrl.searchParams.get("directory") === "1") {
    const branch = request.nextUrl.searchParams.get("branch");
    const where = { ...matchedCustomers, ...(branch && branch.length <= 100 && { joinLocationId: branch }) };
    const pageValue = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 10000) : 1;
    const take = 24;
    const [members, total] = await Promise.all([
      prisma.customer.findMany({
        where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * take, take,
        select: { id: true, name: true, memberNumber: true, pointsBalance: true, createdAt: true,
          ...(admin && { phone: true, birthday: true, joinLocation: { select: { name: true } } }) },
      }),
      prisma.customer.count({ where }),
    ]);
    return json({ members, total, page, pageSize: take, locations: admin ? locations : [] });
  }

  const [rewards, members, history, totals] = await Promise.all([
    prisma.pointsReward.findMany({
      where: { cafeId, ...(admin ? { archivedAt: null } : {
        ...activeRewardWhere(), locations: { some: { locationId: user.cashierLocationId ?? "", location: { archivedAt: null } } },
      }) },
      orderBy: { cost: "asc" }, include: { locations: { select: { locationId: true } } },
    }),
    search || customerId ? prisma.customer.findMany({
      where: matchedCustomers,
      select: { id: true, memberNumber: true, name: true, pointsBalance: true,
        ...(admin && { birthday: true, joinLocation: { select: { name: true } } }) },
      orderBy: { name: "asc" }, take: 25,
    }) : [],
    admin && !checkout ? prisma.pointsTransaction.findMany({
      where: { cafeId, ...(customerId && { customerId }) }, orderBy: { createdAt: "desc" }, take: 80,
      select: { id: true, kind: true, amount: true, delta: true, rewardName: true, receipt: true,
        actorName: true, createdAt: true, balanceAfter: true, customerId: true,
        location: { select: { name: true } }, customer: { select: { name: true } } },
    }) : [],
    admin && !checkout ? prisma.pointsTransaction.groupBy({
      by: ["kind"], where: { cafeId, ...(customerId && { customerId }) },
      _count: { _all: true }, _sum: { amount: true, delta: true },
    }) : [],
  ]);
  const analytics = admin && !checkout && !search && !customerId ? await prisma.$queryRaw<{
    members: number; newMembers: number; returning: number; outstanding: string;
  }[]>`
    SELECT count(*)::int AS members,
      count(*) FILTER (WHERE c."createdAt" >= CURRENT_TIMESTAMP - interval '30 days')::int AS "newMembers",
      count(*) FILTER (WHERE (SELECT count(*) FROM "PointsTransaction" t
        WHERE t."cafeId" = c."cafeId" AND t."customerId" = c.id AND t.kind = 'PURCHASE') > 1)::int AS returning,
      coalesce(sum(c."pointsBalance"), 0)::text AS outstanding
    FROM "Customer" c WHERE c."cafeId" = ${cafeId}
  ` : null;
  const [daily, branches, popular, wallet] = await Promise.all([
    analytics ? prisma.$queryRaw<{ name: string; amount: string }[]>`
      SELECT to_char((t."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${cafe.timezone}, 'YYYY-MM-DD') AS name,
        sum(CASE WHEN kind='REFUND' THEN -amount ELSE amount END)::text AS amount
      FROM "PointsTransaction" t WHERE t."cafeId"=${cafeId}
        AND t."createdAt" >= CURRENT_TIMESTAMP - interval '30 days' AND amount IS NOT NULL
      GROUP BY 1 ORDER BY 1
    ` : [],
    analytics ? prisma.$queryRaw<{ name: string; count: number; amount: string }[]>`
      SELECT l.name, count(*) FILTER (WHERE t.kind='PURCHASE')::int AS count,
        coalesce(sum(CASE WHEN t.kind='REFUND' THEN -t.amount ELSE t.amount END), 0)::text AS amount
      FROM "CafeLocation" l LEFT JOIN "PointsTransaction" t ON t."cafeId"=l."cafeId" AND t."locationId"=l.id
      WHERE l."cafeId"=${cafeId} GROUP BY l.id ORDER BY count DESC, l.name
    ` : [],
    analytics ? prisma.$queryRaw<{ name: string; count: number }[]>`
      SELECT "rewardName" AS name, count(*)::int AS count FROM "PointsTransaction"
      WHERE "cafeId"=${cafeId} AND kind='REDEMPTION' GROUP BY "rewardName" ORDER BY count DESC, name LIMIT 10
    ` : [],
    admin && customerId && members.length ? getWalletStatus(customerId, cafe.slug) : undefined,
  ]);
  return json({ rate: cafe.pointsPerHundred, locations, rewards,
    members: wallet ? members.map(member => ({ ...member, wallet })) : members,
    history, totals, analytics: analytics?.[0], ...(analytics && { breakdown: { daily, branches, popular } }) });
}

async function getWalletStatus(customerId: string, slug: string) {
  const [apple, google] = await Promise.allSettled([
    walletUpdatesEnabled() ? Promise.all(walletPassTypesForBusiness(slug).map(type =>
      walletRedis().hlen(passKey(customerId, type)))).then(counts => counts.some(count => count > 0)) : false,
    googleWalletEnabled() ? googleWalletHasUsers(customerId) : false,
  ]);
  return { apple: apple.status === "fulfilled" ? apple.value : null,
    google: google.status === "fulfilled" ? google.value : null };
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ message: "Invalid request origin." }, 403);
  const access = await accessPoints(request);
  if (access instanceof NextResponse) return access;
  const { cafeId, user, admin } = access;
  const limited = await applyPublicRateLimit(request, publicApiRateLimiters.card, `points:${user.id}`);
  if (limited) return limited;

  try {
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      if (!admin) return json({ message: "Administrator access required." }, 403);
      const image = (await request.formData()).get("photo");
      if (!(image instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(image.type) || image.size > 4000000) {
        return json({ message: "Choose a PNG, JPEG or WebP photo below 4 MB." }, 400);
      }
      let bytes: Buffer;
      try {
        bytes = await sharp(Buffer.from(await image.arrayBuffer()), { limitInputPixels: 16000000 })
          .rotate().resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
      } catch {
        return json({ message: "The photo could not be read." }, 400);
      }
      const blob = await put(`cafes/${cafeId}/rewards/photo.webp`, bytes, {
        access: "public", addRandomSuffix: true, contentType: "image/webp", storeId: rewardPhotoStoreId(),
      });
      return json({ photoUrl: blob.url });
    }
    const body: unknown = await request.json().catch(() => null);
    const transaction = pointsEntrySchema.safeParse(body);
    if (transaction.success) {
      const result = await recordPointsEntry(cafeId, { id: user.id, role: admin ? "CAFE_ADMIN" : "CASHIER" }, transaction.data);
      scheduleWalletUpdate(transaction.data.customerId);
      return json({ balance: result.balance, id: result.entry.id, replay: result.replay });
    }
    if (!admin) return json({ message: "Enter valid transaction details." }, 400);
    const parsed = adminInput.safeParse(body);
    if (!parsed.success) return json({ message: "Enter valid points or reward settings." }, 400);
    const action = parsed.data;
    await withStoreCapacity(cafeId, async tx => {
      if (action.action === "rate") {
        await tx.cafe.update({ where: { id: cafeId }, data: { pointsPerHundred: action.rate } });
        return;
      }
      if (action.action === "archive") {
        const result = await tx.pointsReward.updateMany({
          where: { cafeId, id: action.id, archivedAt: null }, data: { enabled: false, archivedAt: new Date() },
        });
        if (!result.count) throw new StoreCapacityError("Reward not found.", 404);
        return;
      }
      const locationIds = [...new Set(action.locationIds)];
      const count = await tx.cafeLocation.count({ where: { cafeId, archivedAt: null, id: { in: locationIds } } });
      if (count !== locationIds.length) throw new StoreCapacityError("Choose active branches for the reward.", 400);
      if (action.photoUrl) {
        const url = new URL(action.photoUrl);
        const store = rewardPhotoStoreId()?.toLowerCase().replace(/^store_/, "");
        if (!store || url.protocol !== "https:" || url.host !== `${store}.public.blob.vercel-storage.com` ||
            !url.pathname.startsWith(`/cafes/${cafeId}/rewards/`)) throw new StoreCapacityError("Choose an uploaded reward photo.", 400);
      }
      const data = {
        name: action.name, description: action.description || null, conditions: action.conditions || null,
        cost: action.cost, photoUrl: action.photoUrl, enabled: action.enabled,
        expiresAt: action.expiresAt ? new Date(action.expiresAt) : null,
      };
      if (action.id) {
        const changed = await tx.pointsReward.updateMany({ where: { cafeId, id: action.id, archivedAt: null }, data });
        if (!changed.count) throw new StoreCapacityError("Reward not found.", 404);
        await tx.pointsRewardLocation.deleteMany({ where: { cafeId, rewardId: action.id } });
      }
      const rewardId = action.id ?? (await tx.pointsReward.create({ data: { ...data, cafeId } })).id;
      await tx.pointsRewardLocation.createMany({ data: locationIds.map(locationId => ({ cafeId, rewardId, locationId })) });
    });
    if (action.action === "rate") scheduleBusinessWalletUpdate(cafeId);
    return json({ ok: true });
  } catch (error) {
    if (error instanceof StoreCapacityError) return json({ message: error.message }, error.status);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return json({ message: "This transaction has already been recorded." }, 409);
    }
    console.error("Points request failed", error instanceof Error ? error.name : "Unknown error");
    return json({ message: "The points request failed. Try again." }, 500);
  }
}
