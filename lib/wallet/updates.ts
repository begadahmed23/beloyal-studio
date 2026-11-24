import { googleWalletEnabled, syncGoogleWalletMember } from "./google";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { connect } from "node:http2";
import { Redis } from "@upstash/redis";
import { after } from "next/server";
import { businessWalletPassTypes, walletCredential, walletKeyPassphrase, walletPassTypesForBusiness, walletUpdatesEnabled } from "./config";

// Dedicated namespace keeps registration data separate from rate-limit keys.
const namespace = (passType = process.env.APPLE_WALLET_PASS_TYPE_ID) => createHash("sha256").update(`${process.env.APPLE_WALLET_WEB_SERVICE_URL}:${passType}`).digest("hex").slice(0, 16);
export const deviceKey = (device: string, passType?: string) => `beloyal:wallet:v1:${namespace(passType)}:device:${device}`;
export const passKey = (serial: string, passType?: string) => `beloyal:wallet:v1:${namespace(passType)}:pass:${serial}`;
export function walletRedis() {
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
}

const pendingUpdateKey = (serial: string, passType: string) => `${passKey(serial, passType)}:pending-update`;

export async function registerWalletDevice(device: string, serial: string, pushToken: string, passType = process.env.APPLE_WALLET_PASS_TYPE_ID!) {
  const [added, pending] = await walletRedis().eval<string[], [number, number]>(`
    local added = redis.call('SADD', KEYS[1], ARGV[1])
    redis.call('HSET', KEYS[2], ARGV[2], ARGV[3])
    local pending = redis.call('DEL', KEYS[3])
    return {added, pending}`, [deviceKey(device, passType), passKey(serial, passType), pendingUpdateKey(serial, passType)], [serial, device, pushToken]);
  if (pending) after(() => deliverWalletPush(serial, device, pushToken, passType).then(() => undefined));
  return added;
}

export async function unregisterWalletDevice(device: string, serial: string, passType = process.env.APPLE_WALLET_PASS_TYPE_ID!) {
  await walletRedis().eval(`
    redis.call('SREM', KEYS[1], ARGV[1])
    redis.call('HDEL', KEYS[2], ARGV[2])
    return 1`, [deviceKey(device, passType), passKey(serial, passType)], [serial, device]);
}

async function pushToDevice(token: string, passType: string): Promise<number> {
  const [cert, key] = await Promise.all([walletCredential("CERT", passType), walletCredential("KEY", passType)]);
  return new Promise((resolve, reject) => {
    const session = connect("https://api.push.apple.com", { cert, key, passphrase: walletKeyPassphrase(passType) });
    let finished = false;
    const finish = (error?: Error, status = 0) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      session.destroy();
      if (error) reject(error); else resolve(status);
    };
    const timer = setTimeout(() => finish(new Error("Wallet push timed out.")), 5000);
    session.on("error", (error) => finish(error));
    session.on("connect", () => {
      const request = session.request({ ":method": "POST", ":path": `/3/device/${token}`,
        "apns-topic": passType, "apns-priority": "5", "apns-push-type": "background" });
      let status = 0;
      request.on("response", (headers) => { status = Number(headers[":status"]); });
      request.on("data", () => {});
      request.on("error", (error) => finish(error));
      request.on("end", () => finish(undefined, status));
      request.end("{}");
    });
  });
}

async function deliverWalletPush(serial: string, device: string, token: string, passType: string): Promise<boolean> {
  try {
    const status = await pushToDevice(token, passType);
    if (status === 200) return true;
    if (status === 410) await unregisterWalletDevice(device, serial, passType);
    else console.error("Wallet push rejected:", status);
  } catch {
    console.error("Wallet push delivery failed; manual refresh remains available.");
  }
  return false;
}

async function pushWalletPass(serial: string, passType: string, catchUpOnRegistration: boolean) {
  const redis = walletRedis();
  let entries: [string, string][];
  if (catchUpOnRegistration) {
    // Atomically mark an update for registration if the first device has not registered yet.
    const pairs = await redis.eval<[], string[]>(`
      local registrations = redis.call('HGETALL', KEYS[1])
      if #registrations == 0 then redis.call('SET', KEYS[2], '1', 'EX', 3600) end
      return registrations`, [passKey(serial, passType), pendingUpdateKey(serial, passType)], []);
    entries = [];
    for (let i = 0; i < pairs.length; i += 2) entries.push([pairs[i], pairs[i + 1]]);
  } else {
    const registrations = await redis.hgetall<Record<string, string>>(passKey(serial, passType));
    entries = Object.entries(registrations ?? {});
  }
  let accepted = 0;
  for (let i = 0; i < entries.length; i += 5) {
    const delivered = await Promise.all(entries.slice(i, i + 5).map(([device, token]) => deliverWalletPush(serial, device, token, passType)));
    accepted += delivered.filter(Boolean).length;
  }
  const failed = entries.length - accepted;
  return { registered: entries.length, accepted, failed };
}

export async function notifyWalletMember(serial: string, catchUpOnRegistration = false, businessSlug?: string) {
  if (!walletUpdatesEnabled()) return;
  if (!businessSlug && businessWalletPassTypes().length) {
    const member = await prisma.customer.findUnique({ where: { id: serial }, select: { cafe: { select: { slug: true } } } });
    businessSlug = member?.cafe.slug;
  }
  const passTypes = walletPassTypesForBusiness(businessSlug);
  const results = await Promise.all(passTypes.map((type, index) => pushWalletPass(
    serial, type, catchUpOnRegistration && index === passTypes.length - 1,
  )));
  const summary = results.reduce((total, result) => ({
    registered: total.registered + result.registered,
    accepted: total.accepted + result.accepted,
    failed: total.failed + result.failed,
  }), { registered: 0, accepted: 0, failed: 0 });
  if (!summary.registered) return;
  console.info("Wallet push result", summary);
  return summary;
}

export function scheduleWalletUpdate(serial: string) {
  if (!walletUpdatesEnabled() && !googleWalletEnabled()) return;
  after(async () => {
    await Promise.all([
      notifyWalletMember(serial, true).catch(() => {
        console.error("Wallet update scheduling failed; loyalty transaction was already committed.");
      }),
      syncGoogleWalletMember(serial).catch(() => {
        console.error("Google Wallet sync failed; loyalty transaction was already committed.");
      }),
    ]);
  });
}

/**
 * Business settings (reward name/target/branding) change the same data used by
 * the existing Wallet passes. Refresh all installed passes, not only cards
 * whose stamp balance changed. Non-installed Google objects return 404 and
 * unregistered Apple passes have no push recipient.
 *
 * This is intentionally a bounded-concurrency post-response task so saving
 * settings is fast and the Apple and Google services are not flooded.
 */
export function scheduleBusinessWalletUpdate(cafeId: string) {
  if (!walletUpdatesEnabled() && !googleWalletEnabled()) return;
  after(async () => {
    let cursor: string | undefined;
    let updated = 0;
    let failures = 0;
    try {
      while (true) {
        const members = await prisma.customer.findMany({
          where: { cafeId },
          orderBy: { id: "asc" },
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          take: 60,
          select: { id: true, cafe: { select: { slug: true } } },
        });
        if (!members.length) break;
        cursor = members[members.length - 1].id;
        for (let i = 0; i < members.length; i += 12) {
          const results = await Promise.allSettled(members.slice(i, i + 12).map(async ({ id, cafe }) => {
            const updates = await Promise.allSettled([
              walletUpdatesEnabled() ? notifyWalletMember(id, false, cafe.slug) : Promise.resolve(),
              googleWalletEnabled() ? syncGoogleWalletMember(id) : Promise.resolve(),
            ]);
            if (updates.some(result => result.status === "rejected")) {
              throw new Error("Wallet member sync failed");
            }
          }));
          updated += results.filter(result => result.status === "fulfilled").length;
          failures += results.filter(result => result.status === "rejected").length;
        }
        if (members.length < 60) break;
      }
      console.info("Business Wallet sync completed", { cafeId, updated, failures });
    } catch (error) {
      console.error("Business Wallet sync interrupted", { cafeId, updated, failures, error });
    }
  });
}
