const memberPattern = /^BL:([a-f\d]{48})$/i;
const rewardPattern = /^BLR:([a-f\d]{48}):([a-z\d_-]{1,100})$/i;

export function parseLoyaltyScan(value: string) {
  const normalized = value.trim();
  const reward = normalized.match(rewardPattern);
  if (reward) return { token: reward[1].toLowerCase(), rewardId: reward[2] };
  const member = normalized.match(memberPattern);
  return member ? { token: member[1].toLowerCase(), rewardId: null } : null;
}

export function loyaltyScanValue(token: string, rewardId?: string) {
  return rewardId ? `BLR:${token}:${rewardId}` : `BL:${token}`;
}
