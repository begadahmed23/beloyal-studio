import { gourmealWordmark } from "@/lib/business/gourmeal-wordmark";

export default function GourmealWordmark({ name, className }: { name: string; className: string }) {
  const { path, width, height } = gourmealWordmark;
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={name}>
      <path fill="currentColor" fillRule="evenodd" d={path} />
    </svg>
  );
}
