import { ArrowUpRight, Check } from "lucide-react";

export default function Pricing({ arabic = false }: { arabic?: boolean }) {
  const items = arabic ? [
    "كارت ولاء رقمي بلوجو وألوان مشروعك",
    "مكافآت وقواعد ولاء تناسب نشاطك",
    "انضمام وتسجيل أختام واستلام مكافآت بكود QR",
    "قائمة عملائك وسجل نشاطهم في مكان واحد",
    "صلاحيات لفريقك ومساعدة في تجهيز الحساب",
    "تحليل الزيارات المسجّلة واستخدام المكافآت",
    "تقسيم العملاء حسب آخر زيارة وتكرار الزيارات",
    "تجهيز مكافآت أعياد الميلاد حسب اختيارك",
    "تصدير بيانات العملاء والنشاط في ملفات CSV",
  ] : [
    "Digital loyalty card in your logo and colours",
    "Reward rules tailored to your business",
    "QR joining, stamping, and reward redemption",
    "Customer directory and recorded activity history",
    "Staff permissions and guided onboarding",
    "Data analysis of recorded visits and reward usage",
    "Customer groups by visit frequency and last visit",
    "Birthday reward setup for your members",
    "Customer and activity reports with CSV export",
  ];
  return (
    <section id="pricing" className="bg-[#f5f3ee] px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
        <div className="lg:pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{arabic ? "الأسعار" : "Pricing"}</p>
          <h2 className={`mt-5 text-4xl font-semibold sm:text-5xl ${arabic ? "leading-[1.5]" : "leading-[1.08] tracking-[-0.045em]"}`}>{arabic ? <>برنامج ولاء.<br />وفهم أوضح لعملائك.</> : <>Loyalty that works.<br /><span className="text-neutral-500">Insights you can use.</span></>}</h2>
          <p className="mt-7 max-w-lg text-lg leading-8 text-neutral-600">{arabic ? "مش بس كارت رقمي. بنجهّز معاك تجربة الولاء، ونساعدك تفهم الزيارات والمكافآت، وتعرف مين من عملائك بيرجع ومين غاب." : "More than a digital card. We help set up your loyalty experience, understand recorded visits and rewards, and identify the customers who return — and those who haven’t."}</p>
          <p className="mt-6 max-w-lg text-sm leading-7 text-neutral-500">{arabic ? "بنتفق معاك على التجهيز، والتحليل، والدعم المطلوبين. عرض السعر بيوضّح اللي داخل في الخدمة وأي شغل إضافي قبل ما تبدأ." : "Your proposal defines the setup, analysis, and support included, with any additional work agreed before you start."}</p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
          <div className="border-b border-neutral-200 p-6 sm:p-9"><p className="text-sm font-medium text-neutral-600">{arabic ? "BeLoyal لمشروعك" : "BeLoyal for your business"}</p><h3 className={`mt-5 text-3xl font-semibold sm:text-4xl ${arabic ? "leading-[1.5]" : "tracking-[-0.04em]"}`}>{arabic ? "سعر حسب احتياجك" : "Custom pricing"}</h3><p className="mt-3 text-sm leading-7 text-neutral-500">{arabic ? "عرض واحد حسب مشروعك. والتفاصيل واضحة من البداية." : "One proposal around your business. Clear from the start."}</p></div>
          <div className="p-6 sm:p-9"><p className="mb-5 text-xs font-semibold uppercase tracking-wider text-neutral-500">{arabic ? "إيه اللي نقدر نقدّمه لك" : "Build your package around"}</p><ul className="space-y-4">{items.map(item => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-neutral-700"><Check size={17} className="mt-1 shrink-0 text-neutral-900"/>{item}</li>)}</ul><p className="mt-6 border-t border-neutral-200 pt-5 text-xs leading-6 text-neutral-500">{arabic ? "مكافآت أعياد الميلاد بتحتاج تاريخ الميلاد. التحليل بيعتمد على النشاط المسجّل، ونوع التقارير والدعم بيتحدّد في عرضك." : "Birthday rewards require a member’s date of birth. Analysis uses recorded activity; reporting and support scope are defined in your proposal."}</p><a href="#contact" className="mt-7 flex min-h-13 items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800">{arabic ? "خلّينا نتكلم عن مشروعك" : "Let’s talk about your business"}<ArrowUpRight size={17}/></a><p className="mt-4 text-center text-xs text-neutral-500">{arabic ? "الاستفسار من غير أي التزام." : "No commitment to enquire."}</p></div>
        </div>
      </div>
    </section>
  );
}
