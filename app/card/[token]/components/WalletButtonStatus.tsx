import { LoaderCircle } from "lucide-react";

export default function WalletButtonStatus({ message, error, busy }: {
  message: string;
  error: string;
  busy: boolean;
}) {
  return (
    <div className="mt-1 min-h-5 text-center text-xs leading-5">
      <p role="status" className="flex items-center justify-center gap-1.5">
        {busy && <LoaderCircle size={13} aria-hidden="true" className="shrink-0 motion-safe:animate-spin" />}
        {message}
      </p>
      {error && <p role="alert" className="mt-1 font-medium">{error}</p>}
    </div>
  );
}
