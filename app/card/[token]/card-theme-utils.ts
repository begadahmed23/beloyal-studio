type RGB = {
  r: number;
  g: number;
  b: number;
};

export function normalizeHex(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  const shortHexMatch = trimmed.match(/^#([0-9a-fA-F]{3})$/);

  if (shortHexMatch) {
    const characters = shortHexMatch[1].split("");

    return `#${characters
      .map((character) => character + character)
      .join("")}`;
  }

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

function hexToRgb(hex: string): RGB {
  const cleanHex = normalizeHex(hex, "#000000").replace("#", "");

  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB) {
  const convert = (value: number) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, "0");

  return `#${convert(r)}${convert(g)}${convert(b)}`;
}

export function mixColors(
  firstColor: string,
  secondColor: string,
  firstWeight: number,
) {
  const first = hexToRgb(firstColor);
  const second = hexToRgb(secondColor);
  const safeWeight = Math.max(0, Math.min(1, firstWeight));

  return rgbToHex({
    r: first.r * safeWeight + second.r * (1 - safeWeight),
    g: first.g * safeWeight + second.g * (1 - safeWeight),
    b: first.b * safeWeight + second.b * (1 - safeWeight),
  });
}

function getLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const convertChannel = (channel: number) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * convertChannel(r) +
    0.7152 * convertChannel(g) +
    0.0722 * convertChannel(b)
  );
}

export function isLightColor(hex: string) {
  return getLuminance(hex) > 0.42;
}

export function getReadableText(hex: string) {
  return isLightColor(hex) ? "#171717" : "#FFFFFF";
}

export function getDirectLogoUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let url = value.trim();

  if (!url) {
    return null;
  }

  if (url.startsWith("//")) {
    url = `https:${url}`;
  } else if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname === "drive.google.com" ||
      parsedUrl.hostname === "www.drive.google.com"
    ) {
      const fileMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = fileMatch?.[1] || parsedUrl.searchParams.get("id");

      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
          fileId,
        )}&sz=w1000`;
      }
    }

    if (
      parsedUrl.hostname === "dropbox.com" ||
      parsedUrl.hostname === "www.dropbox.com"
    ) {
      parsedUrl.hostname = "dl.dropboxusercontent.com";
      parsedUrl.searchParams.delete("dl");
      parsedUrl.searchParams.delete("raw");
      return parsedUrl.toString();
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}
