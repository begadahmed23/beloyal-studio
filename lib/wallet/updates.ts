import { createHash } from "node:crypto";
import { connect } from "node:http2";
import { Redis } from "@upstash/redis";
import { after } from "next/server";
import { walletCredential, walletUpdatesEnabled } from "./config";

// Dedicated namespace keeps registration data separate from rate-limit keys.
const namespace = () => createHash("sha256").update(`${process.env.APPLE_WALLET_WEB_SERVICE_URL}:${process.env.APPLE_WALLET_PASS_TYPE_ID}`).digest("hex").slice(0, 16);
export const deviceKey = (device: string) => `beloyal:wallet:v1:${namespace()}:device:${device}`;
export const passKey = (serial: string) => `beloyal:wallet:v1:${namespace()}:pass:${serial}`;
export function walletRedis() {
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
}

export async function registerWalletDevice(device: string, serial: string, pushToken: string) {
  return Number(await walletRedis().eval(`
    local added = redis.call('SADD', KEYS[1], ARGV[1])
    redis.call('HSET', KEYS[2], ARGV[2], ARGV[3])
    return added`, [deviceKey(device), passKey(serial)], [serial, device, pushToken]));
}

export async function unregisterWalletDevice(device: string, serial: string) {
  await walletRedis().eval(`
    redis.call('SREM', KEYS[1], ARGV[1])
    redis.call('HDEL', KEYS[2], ARGV[2])
    return 1`, [deviceKey(device), passKey(serial)], [serial, device]);
}

async function pushToDevice(token: string): Promise<number> {
  const [cert, key] = await Promise.all([walletCredential("CERT"), walletCredential("KEY")]);
  return new Promise((resolve, reject) => {
    const session = connect("https://api.push.apple.com", { cert, key, passphrase: process.env.APPLE_WALLET_KEY_PASSPHRASE });
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
        "apns-topic": process.env.APPLE_WALLET_PASS_TYPE_ID!, "apns-priority": "5", "apns-push-type": "background" });
      let status = 0;
      request.on("response", (headers) => { status = Number(headers[":status"]); });
      request.on("data", () => {});
      request.on("error", (error) => finish(error));
      request.on("end", () => finish(undefined, status));
      request.end("{}");
    });
  });
}

export async function notifyWalletMember(serial: string) {
  if (!walletUpdatesEnabled()) return;
  const registrations = await walletRedis().hgetall<Record<string, string>>(passKey(serial));
  if (!registrations) return;
  // Few devices per member; cap concurrency without dropping registrations.
  const entries = Object.entries(registrations);
  let accepted = 0;
  let failed = 0;
  for (let i = 0; i < entries.length; i += 5) {
    await Promise.all(entries.slice(i, i + 5).map(async ([device, token]) => {
      try {
        const status = await pushToDevice(token);
        if (status === 200) accepted++; else failed++;
        if (status === 410) await unregisterWalletDevice(device, serial);
        else if (status !== 200) console.error("Wallet push rejected:", status);
      } catch { failed++; console.error("Wallet push delivery failed; manual refresh remains available."); }
    }));
  }
  console.info("Wallet push result", { registered: entries.length, accepted, failed });
  return { registered: entries.length, accepted, failed };
}

export function scheduleWalletUpdate(serial: string) {
  if (!walletUpdatesEnabled()) return;
  after(async () => {
    try { await notifyWalletMember(serial); }
    catch { console.error("Wallet update scheduling failed; stamp transaction was already committed."); }
  });
}
