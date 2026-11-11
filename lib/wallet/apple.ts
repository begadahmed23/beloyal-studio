import { readFile } from "node:fs/promises";
import { PKPass } from "passkit-generator";
import sharp from "sharp";

type WalletMember = {
  id: string;
  publicToken: string;
  memberNumber: string;
  name: string;
  cafe: { name: string; primaryColor: string; backgroundColor: string };
};

export function appleWalletEnabled() {
  return Boolean(
    process.env.APPLE_WALLET_ENABLED === "true" &&
    process.env.APPLE_WALLET_TEAM_ID &&
    process.env.APPLE_WALLET_PASS_TYPE_ID &&
    (process.env.APPLE_WALLET_CERT_PEM || process.env.APPLE_WALLET_CERT_PATH) &&
    (process.env.APPLE_WALLET_KEY_PEM || process.env.APPLE_WALLET_KEY_PATH) &&
    (process.env.APPLE_WALLET_WWDR_PEM || process.env.APPLE_WALLET_WWDR_PATH) &&
    process.env.APPLE_WALLET_SITE_URL
  );
}

async function credential(name: "CERT" | "KEY" | "WWDR") {
  const pem = process.env[`APPLE_WALLET_${name}_PEM`];
  if (pem) return Buffer.from(pem.replace(/\\n/g, "\n"));
  const path = process.env[`APPLE_WALLET_${name}_PATH`];
  if (!path) throw new Error("Wallet signing configuration is incomplete.");
  return readFile(path);
}

function color(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function rgb(hex: string) {
  return `rgb(${[1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).join(", ")})`;
}

export async function createAppleWalletPass(member: WalletMember) {
  const site = new URL(process.env.APPLE_WALLET_SITE_URL!);
  if (site.protocol !== "https:" && site.hostname !== "localhost") {
    throw new Error("Wallet site URL must use HTTPS.");
  }
  const cardUrl = new URL(`/card/${encodeURIComponent(member.publicToken)}`, site).href;
  const background = color(member.cafe.backgroundColor, "#111111");
  const channels = [1, 3, 5].map((offset) => parseInt(background.slice(offset, offset + 2), 16));
  const light = channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114 > 150;
  const foreground = light ? "#111111" : "#FFFFFF";
  // Local artwork only: no requests to customer-controlled logo URLs.
  const icon = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="87" height="87"><rect width="87" height="87" rx="18" fill="${background}"/><text x="43.5" y="62" text-anchor="middle" font-family="sans-serif" font-size="60" font-weight="bold" fill="${foreground}">B</text></svg>`)).png().toBuffer();
  const pass = new PKPass(
    { "icon.png": await sharp(icon).resize(29, 29).png().toBuffer(),
      "icon@2x.png": await sharp(icon).resize(58, 58).png().toBuffer(),
      "icon@3x.png": icon },
    { signerCert: await credential("CERT"), signerKey: await credential("KEY"),
      wwdr: await credential("WWDR"), signerKeyPassphrase: process.env.APPLE_WALLET_KEY_PASSPHRASE },
    { serialNumber: member.id,
      passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_WALLET_TEAM_ID!,
      organizationName: member.cafe.name,
      description: `${member.cafe.name} loyalty card`,
      logoText: member.cafe.name,
      backgroundColor: rgb(background), foregroundColor: rgb(foreground), labelColor: rgb(foreground) },
  );
  pass.type = "storeCard";
  pass.primaryFields.push({ key: "member", label: "LOYALTY MEMBER", value: member.name });
  pass.secondaryFields.push({ key: "number", label: "MEMBER NUMBER", value: member.memberNumber });
  // Do not show a stamp balance that becomes stale without the update service.
  pass.backFields.push(
    { key: "progress", label: "Live stamps & rewards", value: cardUrl },
    { key: "instructions", label: "How to use", value: "Show this QR code at checkout. Open your online card for your current stamps and rewards." },
    { key: "provider", label: "Powered by", value: "BeLoyal" },
  );
  pass.setBarcodes({ format: "PKBarcodeFormatQR", message: `BL:${member.publicToken}`, messageEncoding: "iso-8859-1", altText: member.memberNumber });
  return pass.getAsBuffer();
}
