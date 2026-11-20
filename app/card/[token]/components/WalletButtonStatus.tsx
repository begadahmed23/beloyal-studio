import { Wallet } from "lucide-react";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

export function WalletButtonProgress() {
  const { t } = useBeLoyalLanguage();
  return (
    <span aria-hidden="true" className="absolute inset-x-1 inset-y-1.5 flex items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-current/20 bg-current/5 px-2 text-[0.68rem] font-semibold leading-tight">
      <Wallet size={14} strokeWidth={1.6} className="shrink-0" />
      {t("Preparing card…")}
      <span className="absolute inset-x-2 bottom-0 h-px overflow-hidden bg-current/10">
        <span className="block h-full w-2/3 origin-left bg-current/55 motion-safe:animate-pulse" />
      </span>
    </span>
  );
}

export default function WalletButtonStatus({ message, error, busy }: {
  message: string;
  error: string;
  busy: boolean;
}) {
  const { t } = useBeLoyalLanguage();
  return (
    <>
      <p role="status" className={busy || !message ? "sr-only" : "mt-1 max-w-36 text-center text-xs leading-5"}>
        {t(message)}
      </p>
      {error && <p role="alert" className="mt-1 max-w-36 text-center text-xs font-medium leading-5">{t(error)}</p>}
    </>
  );
}
