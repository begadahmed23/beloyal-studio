import type { SVGProps } from "react";
import { MB_VAPE_STAMP_PATH } from "@/lib/business/mb-vape";

export default function MbVapeStamp({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" data-mb-vape-stamp="" {...props}>
      <path d={MB_VAPE_STAMP_PATH} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
