import type { BusinessType } from "@prisma/client";

const motifs: Record<BusinessType, string> = {
  CAFE: '<circle cx="320" cy="14" r="72"/><circle cx="320" cy="14" r="60"/><circle cx="320" cy="14" r="48"/><path d="M20 97c26-15 54-13 83 7m-83 5c26-15 54-13 83 7"/>',
  BARBERSHOP: '<path d="M276 0l-58 123m83-123-58 123m83-123-58 123m83-123-58 123m83-123-58 123M9 0l-58 123m81-123-58 123m81-123-58 123"/>',
  VAPE: '<path d="M-5 18c36 29 73-11 111 12s62-9 96 0 88 41 174-5M-5 30c36 29 73-11 111 12s62-9 96 0 88 41 174-5M-5 42c36 29 73-11 111 12s62-9 96 0 88 41 174-5M-5 57c36 29 73-11 111 12s62-9 96 0 88 41 174-5M-5 72c36 29 73-11 111 12s62-9 96 0 88 41 174-5M-5 87c36 29 73-11 111 12s62-9 96 0 88 41 174-5"/>',
  OTHER: '<path d="M211 123V72a65 65 0 0 1 130 0v51M230 123V72a46 46 0 0 1 92 0v51M249 123V72a27 27 0 0 1 54 0v51M20 85h95m-95 12h72m-72 12h48"/>',
};

export const businessCardArtwork = (type: BusinessType, color: string, opacity = 0.25) =>
  `<g fill="none" stroke="${color}" stroke-width="1.4" opacity="${opacity}">${motifs[type]}</g>`;

export function businessCardBackground(type: BusinessType, color: string) {
  const artwork = businessCardArtwork(type, color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 123">${artwork}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function isArtworkBusinessType(value: string): value is BusinessType {
  return Object.hasOwn(motifs, value);
}
