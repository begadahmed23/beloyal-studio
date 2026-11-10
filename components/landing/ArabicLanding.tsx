"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check, QrCode, Star } from "lucide-react";

const section = "scroll-mt-36 px-5 py-20 sm:px-8 lg:py-28";
const heading = "text-3xl font-semibold leading-[1.5] sm:text-5xl";
const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 focus:outline-none focus:ring-2 focus:ring-[#526b5e]";
const features = [
  ["كارت رقمي بهوية مشروعك", "كل عميل بيحصل على كارت شخصي بألوان ولوجو مشروعك، ويفتحه من موبايله."],
  ["تسجيل الزيارات بسهولة", "فريقك يسجّل الزيارة أو الختم بمسح كود العميل بكاميرا الموبايل أو قارئ QR متوافق."],
  ["انضمام من غير تحميل تطبيق", "العميل يمسح كود الانضمام، يدخل بياناته، ويستلم كارت الولاء على المتصفح."],
  ["صورة أوضح عن عملائك", "تابع نمو الأعضاء، النشاط المسجّل، وتبديل المكافآت علشان تفهم مين بيرجع."],
  ["اعرف رأي عملائك", "اجمع تقييمات خاصة وسريعة تساعدك تفهم تجربتهم وتحسّن الخدمة."],
  ["مكافآت تناسب نشاطك", "اختار عدد الأختام أو الزيارات، وحدّد المكافأة والتصميم المناسبين لمشروعك."],
];
const steps = [
  ["العميل ينضم في ثواني", "يمسح كود مشروعك، يدخل بياناته، ويستلم كارت الولاء الشخصي."],
  ["فريقك يسجّل النشاط", "ختم بعد عملية شراء مؤهلة في الكافيه، أو زيارة بعد خدمة مؤهلة في الصالون."],
  ["المكافأة تبقى جاهزة", "الكارت بيتحدّث تلقائيًا ويبيّن تقدّم العميل وموعد استحقاق المكافأة."],
  ["تفهم عملاءك أكتر", "استخدم التقييمات وتحليل الزيارات المسجّلة علشان تطوّر تجربة العملاء."],
];
const insights = [
  ["اعرف عملاءك الدائمين", "قسّم الأعضاء لجدد، ومتكررين، وغير نشطين حسب عدد الزيارات المسجّلة وتاريخ آخر زيارة."],
  ["لاحظ تغيّر عادات الزيارة", "العميل اللي بييجي كل أسبوع مختلف عن اللي بييجي كل شهر. راجع نمط الزيارات وحدّد مين ممكن يحتاج تذكير."],
  ["خلّي المكافآت ليها معنى", "تابع تقدّم الأختام وتبديل المكافآت، وطوّر عروضك حسب استخدام العملاء للبرنامج."],
  ["قِس نتيجة حملاتك", "في تحليل مخصّص، تابع مين رجع بعد العرض، وقارنه بمجموعة مشابهة ما استلمتش العرض لتقدير تأثيره."],
];
const questions = [
  ["هل العميل محتاج يحمّل تطبيق؟", "لأ. العميل بيعمل الكارت ويفتحه من لينك على متصفح موبايله."],
  ["بيشتغل على آيفون وأندرويد؟", "أيوه، الانضمام والكارت بيشتغلوا على متصفحات الموبايل الحديثة في الاتنين."],
  ["الأختام والزيارات بتتسجّل إزاي؟", "فريقك يمسح كود QR الموجود على كارت العميل، وبعدين يؤكّد عملية الشراء أو الخدمة المؤهلة."],
  ["ينفع أغيّر المكافأة والتصميم؟", "أيوه. بنظبط الهدف، وتفاصيل المكافأة، والألوان وتجربة الكارت حسب نشاطك."],
  ["العميل بيستخدم نفس الكارت كل مرة؟", "أيوه، بيحتفظ بالكارت الشخصي ويستخدمه في الزيارات الجاية."],
  ["أبدأ مع BeLoyal إزاي؟", "ابعث لنا تفاصيل مشروعك. بنتفق على المطلوب والتكلفة، وبعدها بنجهّز الحساب والهوية وقواعد الولاء وصلاحيات الفريق."],
  ["تجربة الكافيه مختلفة عن الصالون؟", "أيوه، الكافيه بيستخدم أختام مرتبطة بالمشتريات، والصالون بيستخدم زيارات ومكافآت مرتبطة بالخدمات."],
];

function ArabicContact() {
  const [draft, setDraft] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = ["أهلًا BeLoyal، حابب أعرف تفاصيل برنامج الولاء والتكلفة المناسبة لمشروعي.", "", ...Array.from(data.entries()).map(([key, value]) => `${key}: ${String(value).trim() || "غير محدد"}`)].join("\n");
    const url = `mailto:getbeloyal@gmail.com?subject=${encodeURIComponent(`استفسار BeLoyal — ${data.get("اسم المشروع")}`)}&body=${encodeURIComponent(body)}`;
    setDraft(url);
    window.location.href = url;
  }
  return <section id="contact" className={`${section} bg-[#fcfbf8]`}><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
    <div><p className="mb-4 text-sm text-[#526b5e]">خلّينا نتكلم عن ولاء عملائك</p><h2 className={heading}>عميلك الدائم الجاي<br />بيبدأ من هنا.</h2><p className="mt-6 max-w-lg text-lg leading-9 text-neutral-600">احكي لنا عن مشروعك، ونساعدك تعمل برنامج ولاء يدي عملاءك سبب يرجعوا تاني.</p><p className="mt-8 text-sm text-neutral-600">تفضّل تتواصل معانا مباشرة؟</p><a href="mailto:getbeloyal@gmail.com" dir="ltr" className="mt-3 inline-block break-all font-medium underline underline-offset-4">getbeloyal@gmail.com</a><p className="mt-8 text-sm">بتستخدم BeLoyal بالفعل؟ <Link href="/login" className="underline">دخول الأعمال</Link></p></div>
    <form onSubmit={submit} className="rounded-[2rem] border border-neutral-200 bg-white p-6 sm:p-10"><h3 className="text-2xl font-semibold">خلّينا نعرف مشروعك</h3><p className="mt-3 text-sm leading-7 text-neutral-500">بيانات بسيطة علشان نقترح الحل والتكلفة المناسبين ليك.</p><div className="mt-7 grid gap-5 sm:grid-cols-2">
      {[{name:"اسم المشروع",type:"text",auto:"organization"},{name:"اسمك",type:"text",auto:"name"},{name:"البريد الإلكتروني",type:"email",auto:"email"},{name:"الموبايل / واتساب",type:"tel",auto:"tel"}].map(({name,type,auto}) => <label key={name} className="text-sm font-medium">{name}<input required name={name} type={type} autoComplete={auto} dir={type === "text" ? "auto" : "ltr"} maxLength={160} className={field}/></label>)}
      <label className="text-sm font-medium">نوع النشاط<select required name="نوع النشاط" defaultValue="" className={field}><option value="" disabled>اختار نوع نشاطك</option>{["كافيه / قهوة", "مطعم / مخبز", "صالون / باربر", "نشاط آخر"].map(x => <option key={x}>{x}</option>)}</select></label>
      <label className="text-sm font-medium">عدد الفروع<select required name="عدد الفروع" defaultValue="" className={field}><option value="" disabled>اختار عدد الفروع</option>{["فرع واحد", "من ٢ إلى ٥", "من ٦ إلى ١٠", "أكتر من ١٠"].map(x => <option key={x}>{x}</option>)}</select></label>
      <label className="text-sm font-medium sm:col-span-2">إيه اللي في بالك؟ (اختياري)<textarea name="تفاصيل إضافية" rows={3} maxLength={1500} placeholder="فكرة المكافأة، أهدافك، أو أي متطلبات خاصة…" className={field}/></label>
    </div><p className="mt-5 text-xs leading-6 text-neutral-500">هنستخدم بياناتك للرد على استفسارك. اقرأ <Link href="/privacy" className="underline">سياسة الخصوصية (بالإنجليزية)</Link>.</p><button type="submit" className="mt-5 min-h-12 w-full rounded-full bg-neutral-950 px-5 py-4 text-sm font-semibold text-white">جهّز رسالة الاستفسار</button><p className="mt-3 text-center text-xs leading-6 text-neutral-500">بيفتح مسوّدة في تطبيق البريد عندك، وإنت بتبعتها.</p>{draft && <p role="status" className="mt-5 rounded-xl bg-[#edf2ee] p-4 text-sm leading-7 text-[#385144]">مسوّدة الرسالة جاهزة. ابعتها من تطبيق البريد لإكمال الاستفسار. <a href={draft} className="underline">افتح المسوّدة تاني</a></p>}</form>
  </div></section>;
}

export default function ArabicLanding() {
  return <>
    <section className={`${section} overflow-hidden bg-[#f5f3ee]`}><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div><p className="inline-block rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-neutral-600">مصمّم للكافيهات والصالونات</p><h1 className="mt-7 text-4xl font-semibold leading-[1.5] sm:text-6xl">ادّيهم سبب<br /><span className="text-[#526b5e]">يرجعوا تاني.</span></h1><p className="mt-6 max-w-xl text-lg leading-9 text-neutral-600">حوّل أول زيارة لعلاقة مستمرة. كروت ولاء رقمية بهوية مشروعك، مكافآت ليها قيمة، وفهم أوضح لعادات عملائك — في مكان واحد.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#contact" className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 py-3 text-sm font-semibold text-white">خلّينا نتكلم</a><a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-7 py-3 text-sm font-semibold">شوف طريقة الاستخدام</a></div><p className="mt-7 text-sm leading-8 text-neutral-500">من غير تحميل تطبيق · مسح بالموبايل أو قارئ USB · تقييمات خاصة</p></div>
      <div className="mx-auto w-full max-w-sm"><div className="rounded-[2rem] border border-black/10 bg-white p-7 shadow-xl sm:p-9"><div className="flex items-center justify-between"><span dir="ltr" className="text-xl font-semibold">BeLoyal</span><span className="rounded-full bg-[#edf1ec] px-3 py-1 text-xs text-[#526b5e]">كارت الولاء</span></div><p className="mt-9 text-sm text-neutral-500">أهلًا بيك من جديد</p><h2 className="mt-2 text-2xl font-semibold">خطوة أقرب لمكافأتك</h2><div className="mt-7 grid grid-cols-3 gap-3">{Array.from({length:6}, (_,i) => <span key={i} className={`flex aspect-square items-center justify-center rounded-2xl ${i < 4 ? "bg-[#526b5e] text-white" : "bg-neutral-100 text-neutral-300"}`}><Star size={24} fill={i < 4 ? "currentColor" : "none"}/></span>)}</div><div className="mt-6 flex items-center justify-between rounded-xl bg-[#f5f3ee] p-4"><div><p className="text-sm font-medium">٤ من ٦ أختام</p><p className="mt-2 text-xs text-neutral-500">فاضل ختمين على مكافأتك</p></div><QrCode size={32}/></div></div><p className="mt-4 text-center text-xs text-neutral-500">نموذج توضيحي للكارت · بيانات تجريبية</p></div>
    </div><p className="mx-auto mt-14 max-w-7xl border-t border-black/10 pt-7 text-sm leading-8 text-neutral-600">للمشاريع اللي عملاؤها بيحبوا يرجعوا: كافيهات · صالونات · مخابز · مطاعم</p></section>
    <section id="features" className={section}><div className="mx-auto max-w-7xl"><p className="mb-4 text-sm text-[#526b5e]">المميزات</p><h2 className={heading}>أكتر من كارت أختام.<br />سبب للزيارة الجاية.</h2><p className="mt-6 max-w-2xl text-lg leading-9 text-neutral-600">خلّي برنامج الولاء شبه مشروعك: سهل للعميل، واضح لفريقك، ومفيد ليك.</p><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([title,text]) => <article key={title} className="rounded-2xl border border-neutral-200 p-6 sm:p-8"><h3 className="text-xl font-semibold leading-8">{title}</h3><p className="mt-4 leading-8 text-neutral-600">{text}</p></article>)}</div></div></section>
    <section id="how-it-works" className={`${section} bg-[#111210] text-white`}><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="mb-4 text-sm text-white/60">طريقة الاستخدام</p><h2 className={heading}>سهل لفريقك.<br />بسيط لعملائك.</h2><p className="mt-6 text-lg leading-9 text-white/65">من الانضمام لحد استلام المكافأة، بخطوات واضحة ومن غير كروت ورقية أو تطبيق للعميل.</p></div><ol>{steps.map(([title,text],i) => <li key={title} className="flex gap-5 border-b border-white/20 py-6"><span className="text-[#b9ceb9]">{i+1}</span><div><h3 className="text-xl font-semibold leading-8">{title}</h3><p className="mt-3 leading-8 text-white/65">{text}</p></div></li>)}</ol></div></section>
    <section id="insights" className={`${section} bg-[#edf1ec]`}><div className="mx-auto max-w-7xl"><p className="mb-4 text-sm text-[#526b5e]">البيانات ورا الولاء</p><h2 className={heading}>كل زيارة بتقولك حاجة.</h2><p className="mt-6 max-w-3xl text-lg leading-9 text-neutral-600">برنامج الولاء مش بس عدّاد أختام. سجل نشاط الأعضاء يساعدك تفهم عاداتهم وتاخد قرارات مبنية على بيانات.</p><div className="mt-10 grid gap-4 md:grid-cols-2">{insights.map(([title,text]) => <article key={title} className="rounded-2xl border border-[#526b5e]/15 bg-white/75 p-6 sm:p-8"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-4 leading-8 text-neutral-600">{text}</p></article>)}</div><div className="mt-6 rounded-2xl bg-[#18261e] p-7 text-white"><h3 className="text-2xl leading-9">«مين محتاج نعزمه يرجع؟»</h3><ol className="mt-5 list-inside list-decimal space-y-3 leading-8 text-white/80"><li>نحدّد الأعضاء اللي زياراتهم المسجّلة قلّت.</li><li>نختار عرض مناسب لمجموعة تجريبية صغيرة.</li><li>نتابع الرجوع ونقارنه بمجموعة مشابهة ما استلمتش العرض.</li></ol><p className="mt-5 text-sm leading-7 text-white/65">مثال لتحليل مخصّص بنتفق على تجهيزه وطريقة قياسه معاك.</p></div><p className="mt-6 text-sm leading-8 text-neutral-600">التحليل بيعكس النشاط المسجّل على BeLoyal، مش كل المشتريات. تقييم الحملات تحليل مخصّص. النماذج التنبؤية محتاجة تاريخ بيانات كافي وموثوق واختبار للدقة، وتحليل الإيرادات والإنفاق محتاج قيم المشتريات.</p></div></section>
    <section id="pricing" className={`${section} bg-[#f5f3ee]`}><div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2"><div><p className="mb-4 text-sm text-[#526b5e]">الأسعار</p><h2 className={heading}>مشروعك.<br />برنامج الولاء المناسب ليك.</h2><p className="mt-6 text-lg leading-9 text-neutral-600">من أول فرع لحد خطوتك الجاية، بنجهّز عرض حسب نشاطك، وهويتك، والدعم اللي محتاجه. بنتفق على المطلوب والسعر قبل ما تبدأ.</p></div><div className="rounded-[2rem] border border-black/10 bg-white p-7 sm:p-10"><p className="text-lg font-semibold">BeLoyal لمشروعك</p><h3 className="mt-7 text-3xl font-semibold leading-[1.5] sm:text-4xl">تسعير حسب احتياجك</h3><p className="mt-4 leading-8 text-neutral-500">عرض مخصّص، تفاصيل واضحة، وتجهيز معاك خطوة بخطوة.</p><ul className="my-7 space-y-4 border-y border-neutral-200 py-7">{["كارت ولاء رقمي بهوية مشروعك", "قواعد مكافآت تناسب نشاطك", "انضمام وأختام وتبديل مكافآت بكود QR", "تحليل العملاء وإدارة الأعضاء", "صلاحيات الفريق ومساعدة في الإعداد"].map(x => <li key={x} className="flex gap-3 text-sm leading-7"><Check size={18} className="mt-1 shrink-0 text-[#526b5e]"/>{x}</li>)}</ul><a href="#contact" className="flex min-h-12 items-center justify-center rounded-full bg-black px-5 py-4 text-sm font-semibold text-white">نتكلم عن مشروعك</a><p className="mt-4 text-center text-xs text-neutral-500">الاستفسار من غير أي دفع.</p></div></div></section>
    <section id="faq" className={section}><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]"><h2 className={heading}>أسئلة بتهمّك.<br />وإجابات واضحة.</h2><div>{questions.map(([q,a]) => <details key={q} className="border-b border-neutral-200"><summary className="cursor-pointer py-6 text-lg font-medium leading-8">{q}</summary><p className="pb-6 leading-8 text-neutral-600">{a}</p></details>)}</div></div></section>
    <ArabicContact />
    <footer className="border-t border-neutral-200 px-5 py-12"><div className="mx-auto max-w-7xl"><Link href="/" dir="ltr" className="inline-block text-2xl font-semibold">BeLoyal</Link><p className="mt-4 leading-8 text-neutral-500">ادّيهم سبب يرجعوا تاني. ولاء رقمي للمشاريع اللي بتهتم بعملائها الدائمين.</p><nav aria-label="روابط أسفل الصفحة" className="mt-7 flex flex-wrap gap-x-6 gap-y-4 text-sm text-neutral-600"><a href="#features">المميزات</a><a href="#insights">تحليل العملاء</a><a href="#pricing">الأسعار</a><Link href="/login">دخول الأعمال</Link><Link href="/privacy">الخصوصية (بالإنجليزية)</Link><Link href="/terms">الشروط (بالإنجليزية)</Link><Link href="/data-deletion">حذف البيانات (بالإنجليزية)</Link><a href="mailto:getbeloyal@gmail.com" dir="ltr">getbeloyal@gmail.com</a></nav><div className="mt-9 flex flex-wrap justify-between gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-500"><p>© 2026 BeLoyal. جميع الحقوق محفوظة.</p><p>الإسكندرية، مصر</p></div></div></footer>
  </>;
}
