export const GOURMEAL = {
  green: "#294B38",
  lime: "#9ACD32",
  stone: "#E9E8E4",
  sand: "#DDD1C1",
  butter: "#F4E3A1",
  artwork: "/api/wallet/artwork/gourmeal",
} as const;

export function isGourmeal({ slug }: { slug: string }) {
  return slug === "goumeal" || slug === "gourmeal";
}

export function gourmealStripPath(stamps: number, target: number, asset: "strip" | "google-strip" = "strip") {
  return `${GOURMEAL.artwork}?asset=${asset}&stamps=${stamps}&target=${target}&v=${asset === "google-strip" ? 2 : 1}`;
}
