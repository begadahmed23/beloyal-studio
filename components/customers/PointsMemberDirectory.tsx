"use client";

import { useEffect, useState } from "react";
import { Download, Search, Users } from "lucide-react";
import NewCustomerDialog from "./NewCustomerDialog";
import PointsScanCheckout from "@/components/dashboard/PointsScanCheckout";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";
import { fireyNashBrand } from "@/lib/business/points";

export type DirectoryMember = {
  id: string;
  name: string;
  memberNumber: string;
  pointsBalance: string;
  createdAt: string;
  phone?: string | null;
  birthday?: string;
  joinLocation?: { name: string } | null;
};

type DirectoryResult = {
  members: DirectoryMember[];
  total: number;
  page: number;
  pageSize: number;
  locations: { id: string; name: string }[];
};

const control = "min-h-11 rounded-xl border border-input bg-background px-3 text-sm";
const action = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50";

export default function PointsMemberDirectory({ database, onSelect }: {
  database?: boolean;
  onSelect?: (member: DirectoryMember) => void;
}) {
  const { cafe, userRole } = useCafeTheme();
  const { arabic, lang, dir } = useBeLoyalLanguage();
  const copy = (en: string, ar: string) => arabic ? ar : en;
  const admin = userRole === "CAFE_ADMIN";
  const unit = cafe.slug === fireyNashBrand.slug ? copy("Flames", "لهب") : copy("Points", "نقاط");
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [page, setPage] = useState(1);
  const [directory, setDirectory] = useState<DirectoryResult | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [checkout, setCheckout] = useState<DirectoryMember | null>(null);
  const [saved, setSaved] = useState("");
  useEffect(() => {
    function refreshMembers() {
      setPage(1);
      setRevision(value => value + 1);
    }
    window.addEventListener("members-updated", refreshMembers);
    return () => window.removeEventListener("members-updated", refreshMembers);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ directory: "1", search: query, branch, page: String(page) });
        const response = await fetch(`/api/loyalty/points?${params}`, { signal: abort.signal, cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        if (!abort.signal.aborted) {
          setDirectory(body);
          setError("");
        }
      } catch (reason) {
        if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to load members.");
      }
    }, 200);
    return () => { abort.abort(); clearTimeout(timeout); };
  }, [query, branch, page, revision]);

  const date = (value: string) => new Intl.DateTimeFormat(arabic ? "ar-EG" : "en-EG", {
    dateStyle: "medium", timeZone: cafe.timezone,
  }).format(new Date(value));
  const showRow = (member: DirectoryMember) => database ? onSelect?.(member) : setCheckout(member);
  const rowLabel = database ? copy("View details", "عرض التفاصيل") : copy("Checkout", "الكاشير");

  return (
    <section lang={lang} dir={dir} className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{database ? copy("Customer database", "قاعدة بيانات العملاء") : copy("Members", "الأعضاء")}</h1>
          {directory && <p className="mt-1 text-sm text-muted-foreground">{directory.total} {copy("members", "عضو")}</p>}
        </div>
        {database ? <a href="/api/loyalty/points/export?view=customers" className={action}><Download size={16} />{copy("Download CSV", "حمّل CSV")}</a> : <NewCustomerDialog />}
      </header>

      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-border p-4 sm:p-5">
          <label className="relative min-w-0 basis-full sm:flex-1">
            <Search size={16} className="pointer-events-none absolute start-3 top-3.5 text-muted-foreground" aria-hidden="true" />
            <input aria-label={copy("Search members", "ابحث عن عضو")} placeholder={copy("Name, phone or membership number", "الاسم أو الهاتف أو رقم العضوية")}
              type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }}
              className={`${control} w-full ps-10`} maxLength={100} />
          </label>
          {!!directory?.locations.length && <select aria-label={copy("Signup branch", "فرع التسجيل")} className={control} value={branch} onChange={event => { setBranch(event.target.value); setPage(1); }}>
            <option value="">{copy("All branches", "كل الفروع")}</option>
            {directory.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>}
        </div>
        {error && <p role="alert" className="p-4 text-sm text-destructive">{error}</p>}
        {!directory && !error && <p role="status" className="p-5 text-sm text-muted-foreground">{copy("Loading members…", "جارٍ تحميل الأعضاء…")}</p>}
        {directory?.members.length ? <>
          {database && <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-border bg-secondary/60 text-xs text-muted-foreground"><tr>
                {[copy("Customer", "العميل"), copy("Phone", "الهاتف"), unit, copy("Signup branch", "فرع التسجيل"), copy("Joined", "تاريخ التسجيل")].map(label => <th key={label} scope="col" className="p-4 text-start font-semibold">{label}</th>)}
                <th scope="col" className="p-4"><span className="sr-only">{rowLabel}</span></th>
              </tr></thead>
              <tbody className="divide-y divide-border">{directory.members.map(member => <tr key={member.id}>
                <td className="p-4"><p className="font-semibold">{member.name}</p><p className="mt-1 text-xs text-muted-foreground">{member.memberNumber}</p></td>
                <td className="p-4" dir="ltr">{member.phone || "—"}</td>
                <td className="p-4 tabular-nums">{member.pointsBalance}</td>
                <td className="p-4">{member.joinLocation?.name ?? "—"}</td>
                <td className="whitespace-nowrap p-4">{date(member.createdAt)}</td>
                <td className="p-4"><button className={action} onClick={() => showRow(member)}>{rowLabel}</button></td>
              </tr>)}</tbody>
            </table>
          </div>}
          <ul className={`grid gap-3 p-4 sm:grid-cols-2 sm:p-5 ${database ? "md:hidden" : "xl:grid-cols-3"}`}>
            {directory.members.map(member => <li key={member.id} className="min-w-0 rounded-2xl border border-border p-4">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0"><p className="wrap-anywhere font-semibold">{member.name}</p><p className="mt-1 text-xs text-muted-foreground">{member.memberNumber}</p></div>
                <div className="text-end"><p className="wrap-anywhere font-semibold tabular-nums text-primary">{member.pointsBalance}</p><p className="text-xs text-muted-foreground">{unit}</p></div>
              </div>
              {admin && <p className="mt-3 text-xs text-muted-foreground">{member.joinLocation?.name ?? copy("No signup branch", "بدون فرع تسجيل")}</p>}
              <button className={`${action} mt-4 w-full`} onClick={() => showRow(member)}>{rowLabel}</button>
            </li>)}
          </ul>
        </> : directory && <div className="grid justify-items-center gap-3 p-12 text-sm text-muted-foreground"><Users size={24} />{copy("No members found.", "مفيش أعضاء مطابقين.")}</div>}
        {directory && directory.total > directory.pageSize && <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <button className={action} disabled={page <= 1} onClick={() => setPage(page - 1)}>{copy("Previous", "السابق")}</button>
          <span className="text-sm tabular-nums">{page} / {Math.ceil(directory.total / directory.pageSize)}</span>
          <button className={action} disabled={page * directory.pageSize >= directory.total} onClick={() => setPage(page + 1)}>{copy("Next", "التالي")}</button>
        </div>}
      </div>
      {saved && <p role="status" className="text-sm font-medium text-primary">{saved}</p>}
      {checkout && <PointsScanCheckout memberId={checkout.id} onCancel={() => setCheckout(null)} onComplete={result => {
        setCheckout(null);
        setRevision(value => value + 1);
        setSaved(`${result.name} · ${result.balance} ${unit}`);
      }} />}
    </section>
  );
}
