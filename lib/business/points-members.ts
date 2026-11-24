import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function pointsMemberSearch(search: string): Prisma.CustomerWhereInput {
  if (!search) return {};
  const digits = search.replace(/[^0-9]/g, "");
  return {
    OR: [
      { memberNumber: { equals: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      ...(/^[+\d -]+$/.test(search) && digits.length >= 5 ? [{ phone: { endsWith: digits } }] : []),
    ],
  };
}

export async function pointsMemberSpending(cafeId: string, customerIds: string[]) {
  if (!customerIds.length) return new Map<string, { purchases: number; netSpending: string; lastPurchase: Date | null }>();
  const groups = await prisma.pointsTransaction.groupBy({
    by: ["customerId", "kind"],
    where: { cafeId, customerId: { in: customerIds }, kind: { in: ["PURCHASE", "REFUND"] } },
    _sum: { amount: true }, _count: { _all: true }, _max: { createdAt: true },
  });
  const amounts = new Map(groups.map(row => [`${row.customerId}:${row.kind}`, row]));
  return new Map(customerIds.map(id => {
    const purchase = amounts.get(`${id}:PURCHASE`);
    const refund = amounts.get(`${id}:REFUND`);
    return [id, {
      purchases: purchase?._count._all ?? 0,
      lastPurchase: purchase?._max.createdAt ?? null,
      netSpending: purchase?._sum.amount?.minus(refund?._sum.amount ?? 0).toFixed(2) ?? "0.00",
    }];
  }));
}

const inactiveDays: Record<string, number> = { inactive7: 7, inactive14: 14, inactive21: 21, inactive30: 30 };
const purchaseForMember = Prisma.sql`FROM "PointsTransaction" t
  WHERE t."cafeId" = m."cafeId" AND t."customerId" = m.id AND t.kind = 'PURCHASE'`;

export function pointsCustomerScope(cafeId: string, timezone: string, params: URLSearchParams, now = new Date()) {
  const search = params.get("search")?.trim().slice(0, 100) ?? "";
  const customer = params.get("customer")?.slice(0, 100);
  const branch = params.get("branch")?.slice(0, 100);
  const birthday = params.get("birthday");
  const activity = params.get("activity") ?? "";
  const contact = params.get("contact");
  const clauses: Prisma.Sql[] = [Prisma.sql`m."cafeId" = ${cafeId}`];

  if (customer) clauses.push(Prisma.sql`m.id = ${customer}`);
  if (branch) clauses.push(Prisma.sql`m."joinLocationId" = ${branch}`);
  if (search) {
    const digits = search.replace(/[^0-9]/g, "");
    const username = search.replace(/^@+/, "");
    const byPhone = /^[+\d -]+$/.test(search) && digits.length >= 5
      ? Prisma.sql`OR strpos(coalesce(m.phone, ''), ${digits}) > 0`
      : Prisma.empty;
    const byInstagram = username ? Prisma.sql`OR strpos(lower(coalesce(m.instagram, '')), lower(${username})) > 0` : Prisma.empty;
    clauses.push(Prisma.sql`(
      strpos(lower(m.name), lower(${search})) > 0
      OR strpos(lower(m."memberNumber"), lower(${search})) > 0
      OR strpos(lower(coalesce(l.name, '')), lower(${search})) > 0
      ${byPhone} ${byInstagram}
    )`);
  }

  const today = Prisma.sql`((${now.toISOString()}::timestamptz AT TIME ZONE ${timezone})::date)`;
  if (birthday === "thisMonth") {
    clauses.push(Prisma.sql`extract(month from m.birthday) = extract(month from ${today})`);
  } else if (birthday === "today" || birthday === "next7") {
    const days = birthday === "today" ? 0 : 7;
    clauses.push(Prisma.sql`EXISTS (
      SELECT 1 FROM generate_series(0, ${days}::int) AS days(day_offset)
      CROSS JOIN LATERAL (SELECT ${today} + days.day_offset AS day) AS dates
      WHERE to_char(m.birthday, 'MM-DD') = to_char(dates.day, 'MM-DD')
        OR (to_char(m.birthday, 'MM-DD') = '02-29' AND to_char(dates.day, 'MM-DD') = '02-28'
          AND to_char(dates.day + 1, 'MM-DD') = '03-01')
    )`);
  }

  if (activity === "active30") {
    const cutoff = new Date(now.getTime() - 30 * 86400000);
    clauses.push(Prisma.sql`EXISTS (SELECT 1 ${purchaseForMember} AND t."createdAt" >= ${cutoff})`);
  } else if (Object.hasOwn(inactiveDays, activity)) {
    const cutoff = new Date(now.getTime() - inactiveDays[activity] * 86400000);
    clauses.push(Prisma.sql`NOT EXISTS (SELECT 1 ${purchaseForMember} AND t."createdAt" > ${cutoff})`);
  } else if (activity === "neverReturned") {
    clauses.push(Prisma.sql`NOT EXISTS (SELECT 1 ${purchaseForMember} OFFSET 1)`);
  }

  if (contact === "phone") clauses.push(Prisma.sql`nullif(m.phone, '') IS NOT NULL`);
  if (contact === "instagram") clauses.push(Prisma.sql`nullif(m.instagram, '') IS NOT NULL`);
  if (params.get("frequent") === "1") clauses.push(Prisma.sql`EXISTS (SELECT 1 ${purchaseForMember} OFFSET 4)`);
  if (params.get("rewardReady") === "1") {
    clauses.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "PointsReward" r
      WHERE r."cafeId" = m."cafeId" AND r.enabled AND r."archivedAt" IS NULL
        AND (r."expiresAt" IS NULL OR r."expiresAt" > ${now}) AND r.cost <= m."pointsBalance"
        AND EXISTS (
          SELECT 1 FROM "PointsRewardLocation" rl JOIN "CafeLocation" store
            ON store."cafeId" = rl."cafeId" AND store.id = rl."locationId"
          WHERE rl."cafeId" = r."cafeId" AND rl."rewardId" = r.id AND store."archivedAt" IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM "PointsRewardClaim" claim
          WHERE claim."cafeId" = m."cafeId" AND claim."customerId" = m.id AND claim."rewardId" = r.id
            AND claim."consumedAt" IS NOT NULL AND claim."expiresAt" > ${now}
        )
    )`);
  }

  return Prisma.sql`FROM "Customer" m LEFT JOIN "CafeLocation" l
    ON l."cafeId" = m."cafeId" AND l.id = m."joinLocationId"
    WHERE ${Prisma.join(clauses, " AND ")}`;
}

type CustomerRow = {
  id: string; name: string; memberNumber: string; pointsBalance: Prisma.Decimal;
  birthday: Date; createdAt: Date; joinLocation: { name: string } | null;
};

export async function pointsCustomerPage(cafeId: string, scope: Prisma.Sql, pagination:
  { offset: number; take: number } | { after: string | undefined; take: number }) {
  const paging = "offset" in pagination
    ? Prisma.sql`ORDER BY m."createdAt" DESC, m.id DESC OFFSET ${pagination.offset} LIMIT ${pagination.take}`
    : Prisma.sql`${pagination.after ? Prisma.sql`AND m.id > ${pagination.after}` : Prisma.empty}
      ORDER BY m.id ASC LIMIT ${pagination.take}`;
  const rows = await prisma.$queryRaw<CustomerRow[]>`
    SELECT m.id, m.name, m."memberNumber", m."pointsBalance", m.birthday, m."createdAt",
      CASE WHEN l.id IS NULL THEN NULL ELSE jsonb_build_object('name', l.name) END AS "joinLocation"
    ${scope} ${paging}
  `;
  const totals = await pointsMemberSpending(cafeId, rows.map(row => row.id));
  return rows.map(row => ({
    ...row, ...(totals.get(row.id) ?? { netSpending: "0.00", purchases: 0, lastPurchase: null }),
  }));
}

export async function pointsCustomerCount(scope: Prisma.Sql) {
  const [result] = await prisma.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total ${scope}`;
  return result.total;
}
