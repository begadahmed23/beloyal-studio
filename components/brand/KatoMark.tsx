"use client";

type Props = {
  active?: boolean;
  size?: number;
  className?: string;
};

export default function KatoMark({
  active = false,
  size = 42,
  className,
}: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{
        overflow: "visible",
        filter: active
          ? "drop-shadow(0 0 11px rgba(255,255,255,0.95))"
          : "none",
      }}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M250 140 A150 150 0 1 0 250 440 A150 150 0 1 0 250 140 Z M250 174 A116 116 0 1 1 250 406 A116 116 0 1 1 250 174 Z"
      />

      <path
        fill="currentColor"
        d="M180 60 L180 98 C220 120 280 120 320 98 L320 60 C275 90 225 90 180 60 Z"
      />
    </svg>
  );
}
