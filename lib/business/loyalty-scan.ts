export const loyaltyTokenPattern = /^[a-f\d]{48}$/i;

export function parseLoyaltyScan(value: string) {
  const [prefix, token, ...rest] = value.trim().split(":");
  if (!token || !loyaltyTokenPattern.test(token)) return null;
  switch (prefix.toUpperCase()) {
    case "BL":
      return rest.length === 0 ? { kind: "member" as const, token: token.toLowerCase() } : null;
    case "BLR2":
      return rest.length === 0 ? { kind: "reward" as const, code: token.toLowerCase() } : null;
    case "BLR":
      return rest.length === 1 && /^[a-z\d_-]{1,100}$/i.test(rest[0]) ? { kind: "legacy-reward" as const } : null;
    default:
      return null;
  }
}

export function loyaltyScanValue(token: string) {
  return `BL:${token}`;
}

export function rewardScanValue(code: string) {
  return `BLR2:${code}`;
}
