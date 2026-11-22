import sharp from "sharp";

export const LORETTO_DARK = "#193A32";
export const LORETTO_CREAM = "#F8F5ED";
export const LORETTO_GOLD = "#D2BA8A";

export async function renderLorettoArtwork(stamps: number, target: number, kind: "strip" | "logo" | "icon" = "strip") {
  if (kind === "icon") {
    return sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="56" fill="#193A32"/><rect x="24" y="24" width="464" height="464" rx="40" fill="none" stroke="#D2BA8A" stroke-width="6"/><text x="256" y="305" text-anchor="middle" fill="#F8F5ED" font-size="260" font-family="DejaVu Serif, serif">L</text><path d="M140 355 H372" stroke="#D2BA8A" stroke-width="5"/></svg>')).png().toBuffer();
  }
  if (kind === "logo") {
    return sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="750" height="230" viewBox="0 0 750 230">' +
      '<rect width="750" height="230" fill="#193A32"/>' +
      '<text x="375" y="125" text-anchor="middle" fill="#F8F5ED" font-size="92" letter-spacing="7" font-family="DejaVu Sans, sans-serif" font-weight="bold">LORETTO</text>' +
      '<path d="M200 150 H550" stroke="#D2BA8A" stroke-width="2"/>' +
      '<text x="375" y="195" text-anchor="middle" fill="#D2BA8A" font-size="24" letter-spacing="6" font-family="DejaVu Sans, sans-serif">YOUR DAILY RITUAL</text></svg>')).png().toBuffer();
  }
  const count = Math.max(1, Math.min(12, Math.floor(target)));
  const filled = Math.max(0, Math.min(count, Math.floor(stamps)));
  const rowCount = count > 8 ? 2 : 1;
  const perRow = Math.ceil(count / rowCount);
  const spacing = 720 / perRow;
  const badges = Array.from({ length: count }, (_, i) => {
    const x = 190 + (i % perRow) * spacing + spacing / 2;
    const y = rowCount === 1 ? 264 : 226 + Math.floor(i / perRow) * 100;
    const active = i < filled;
    return '<circle cx="' + x + '" cy="' + y + '" r="29" fill="' + (active ? LORETTO_GOLD : 'none') + '" stroke="#D2BA8A" stroke-width="2.5"/>' +
      (active ? '<path d="M' + (x-11) + ' ' + y + ' l8 8 16 -19" stroke="#193A32" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' :
      '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#D2BA8A" opacity=".5"/>');
  }).join('');
  const status = filled >= count ? 'YOUR REWARD IS READY' : String(filled) + ' OF ' + String(target) + ' STAMPS  ·  KEEP COMING BACK';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1125" height="432" viewBox="0 0 1125 432">' +
    '<rect width="1125" height="432" fill="#193A32"/>' +
    '<rect x="8" y="8" width="1109" height="416" rx="12" fill="none" stroke="#D2BA8A" stroke-opacity=".35" stroke-width="3"/>' +
    '<text x="562" y="104" text-anchor="middle" fill="#F8F5ED" font-size="47" letter-spacing="8" font-family="DejaVu Sans, sans-serif" font-weight="bold">LORETTO</text>' +
    '<text x="562" y="157" text-anchor="middle" fill="#D2BA8A" font-size="22" letter-spacing="6" font-family="DejaVu Sans, sans-serif">THE LITTLE THINGS ADD UP</text>' +
    badges + '<text x="562" y="399" text-anchor="middle" fill="#F8F5ED" font-size="24" letter-spacing="3" font-family="DejaVu Sans, sans-serif">' + status + '</text></svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}
