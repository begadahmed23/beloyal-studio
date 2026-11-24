"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Download, Search, Users } from "lucide-react";
import NewCustomerDialog from "./NewCustomerDialog";
import PointsMemberProfile from "./PointsMemberProfile";
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
  netSpending?: string;
  purchases?: number;
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

const control = "min-h-11 min-w-0 rounded-xl border border-input bg-background px-3 text-base";
const action = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50";

export default function PointsMemberDirectory({ database = false }: { database?: boolean }) {
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
  const [selected, setSelected] = useState<DirectoryMember | null>(null);
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
        if (database) params.set("spending", "1");
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
  }, [query, branch, page, revision, database]);

  const locale = arabic ? "ar-EG" : "en-EG";
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EGP", maximumFractionDigits: 2 });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  const spending = (member: DirectoryMember) => money.format(Number(member.netSpending ?? "0"));
  const exportParams = new URLSearchParams({ view: "customers", ...(query.trim() && { search: query.trim() }), ...(branch && { branch }) });
  const showRow = (member: DirectoryMember) => admin ? setSelected(member) : setCheckout(member);

  return (
    <section lang={lang} dir={dir} className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{database ? copy("Customer database", "قاعدة بيانات العملاء") : copy("Members", "الأعضاء")}</h1>
          {directory && <p className="mt-1 text-sm text-muted-foreground">{directory.total} {copy("members", "عضو")}</p>}
        </div>
        {database ? <a href={`/api/loyalty/points/export?${exportParams}`} className={action}><Download size={16} aria-hidden="true" />{copy("Download summary CSV", "تحميل ملخص CSV")}</a> : <NewCustomerDialog />}
      </header>

      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-border p-4 sm:p-5">
          <label className="relative min-w-0 basis-full sm:flex-1">
            <Search size={16} className="pointer-events-none absolute start-3 top-3.5 text-muted-foreground" aria-hidden="true" />
            <input aria-label={copy("Search members", "ابحث عن عضو")} placeholder={copy("Name, phone or membership number", "الاسم أو الهاتف أو رقم العضوية")}
              type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }}
              className={`${control} w-full ps-10`} maxLength={100} />
          </label>
          {!!directory?.locations.length && <select aria-label={copy("Signup branch", "فرع التسجيل")} className={`${control} w-full max-w-full sm:w-auto sm:max-w-[48%]`} value={branch} onChange={event => { setBranch(event.target.value); setPage(1); }}>
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
                {[copy("Customer", "العميل"), copy("Recorded spending", "الإنفاق المسجل"), copy("Purchases", "عمليات الشراء"), unit, copy("Signup branch", "فرع التسجيل")].map(label => <th key={label} scope="col" className="p-4 text-start font-semibold">{label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">{directory.members.map(member => <tr key={member.id} className="hover:bg-secondary/30">
                <td className="p-4"><button type="button" onClick={() => showRow(member)} className="min-h-11 text-start">
                  <span className="block wrap-anywhere font-semibold text-primary">{member.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{member.memberNumber}</span>
                </button></td>
                <td className="p-4 font-semibold tabular-nums"><bdi>{spending(member)}</bdi></td>
                <td className="p-4 tabular-nums">{number.format(member.purchases ?? 0)}</td>
                <td className="p-4 tabular-nums">{number.format(Number(member.pointsBalance))}</td>
                <td className="p-4">{member.joinLocation?.name ?? "—"}</td>
              </tr>)}</tbody>
            </table>
          </div>}
          <ul className={`grid gap-3 p-3 sm:grid-cols-2 sm:p-5 ${database ? "md:hidden" : "xl:grid-cols-3"}`}>
            {directory.members.map(member => <li key={member.id} className="min-w-0 rounded-2xl border border-border">
              <button type="button" onClick={() => showRow(member)} className="block w-full min-w-0 rounded-2xl p-4 text-start hover:bg-secondary/35">
                <span className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block wrap-anywhere font-semibold">{member.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{member.memberNumber}</span>
                  </span>
                  <ChevronRight size={17} className="shrink-0 text-primary rtl:rotate-180" aria-hidden="true" />
                </span>
                <span className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                  <span><strong className="tabular-nums text-primary">{number.format(Number(member.pointsBalance))}</strong> {unit}</span>
                  {database && <strong className="tabular-nums"><bdi>{spending(member)}</bdi></strong>}
                </span>
                {database && <span className="mt-1 block text-xs text-muted-foreground">{number.format(member.purchases ?? 0)} {copy("purchases", "عملية شراء")}</span>}
                {admin && <span className="mt-2 block wrap-anywhere text-xs text-muted-foreground">{member.joinLocation?.name ?? copy("No signup branch", "بدون فرع تسجيل")}</span>}
              </button>
              {!database && <div className="px-4 pb-3">
                <button type="button" className={`${action} w-full`} onClick={() => setCheckout(member)}>{copy("Checkout", "الكاشير")}</button>
              </div>}
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
      {selected && admin && <PointsMemberProfile key={selected.id} selected={selected} onClose={() => setSelected(null)}
        onCheckout={member => { setSelected(null); setCheckout(member); }}
        onUpdated={() => setRevision(value => value + 1)} />}
      {checkout && <PointsScanCheckout memberId={checkout.id} onCancel={() => setCheckout(null)} onComplete={result => {
        setCheckout(null);
        setRevision(value => value + 1);
        setSaved(`${result.name} · ${result.balance} ${unit}`);
      }} />}
    </section>
  );
}
