import { MB_VAPE_LOGO_URL } from "@/lib/business/mb-vape";

export default function MbVapeLogo({ className = "" }: { className?: string }) {
  return (
    // Keep the supplied mark intact in every size.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={MB_VAPE_LOGO_URL} alt="MB" width={696} height={485}
      className={`shrink-0 rounded-lg bg-white object-contain ${className}`} />
  );
}
