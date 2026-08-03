export function calculateBirthdayCountdown(birthday: string) {
  const birthdayDate = new Date(birthday);
  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const nextBirthday = new Date(
    today.getFullYear(),
    birthdayDate.getUTCMonth(),
    birthdayDate.getUTCDate(),
  );

  if (nextBirthday < todayStart) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return Math.ceil(
    (nextBirthday.getTime() - todayStart.getTime()) /
      86_400_000,
  );
}

export function getProgressMessage(
  stamps: number,
  rewardTarget: number,
  rewardName: string,
) {
  const safeRewardName = rewardName?.trim() || "reward";
  const lowerRewardName = safeRewardName.toLowerCase();

  if (stamps >= rewardTarget) {
    return {
      title: `${safeRewardName} is ready`,
      description: `Show this card to the cashier to redeem your ${lowerRewardName}.`,
    };
  }

  const remaining = rewardTarget - stamps;

  if (remaining === 1) {
    return {
      title: "One more stamp",
      description: `Your ${lowerRewardName} is almost ready.`,
    };
  }

  if (stamps >= Math.ceil(rewardTarget / 2)) {
    return {
      title: "More than halfway there",
      description: `Keep going. Your ${lowerRewardName} is getting closer.`,
    };
  }

  if (stamps > 0) {
    return {
      title: "Great start",
      description: `Every eligible purchase brings you closer to your ${lowerRewardName}.`,
    };
  }

  return {
    title: "Your journey starts here",
    description:
      "Make an eligible purchase to receive your first stamp.",
  };
}

export function withAlpha(hex: string, alpha: number) {
  const cleanHex = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return hex;
  }

  const red = parseInt(cleanHex.slice(0, 2), 16);
  const green = parseInt(cleanHex.slice(2, 4), 16);
  const blue = parseInt(cleanHex.slice(4, 6), 16);
  const safeAlpha = Math.min(1, Math.max(0, alpha));

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
}