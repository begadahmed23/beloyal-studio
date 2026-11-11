import { Coffee, Scissors, Car, Croissant } from "lucide-react";

export default function BusinessTypes({ arabic = false }: { arabic?: boolean }) {
  const businesses = [
    { icon: Coffee, name: arabic ? "كافيهات" : "Cafés", text: arabic ? "خلّي قهوتك جزء من يومهم." : "Make your coffee their daily ritual." },
    { icon: Scissors, name: arabic ? "صالونات" : "Salons", text: arabic ? "من أول زيارة للحجز الجاي." : "From a first visit to their next booking." },
    { icon: Car, name: arabic ? "مغاسل عربيات" : "Car washes", text: arabic ? "كل غسلة تقرّبهم من مكافأة." : "Turn every clean into a reason to return." },
    { icon: Croissant, name: arabic ? "مخابز" : "Bakeries", text: arabic ? "طعم يحبّوه، وسبب يرجعوا عشانه." : "A favourite treat. Another reason to stop by." },
  ];
  return <div className="mt-12 border-t border-black/10 pt-7 sm:mt-14">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">{arabic ? "لمشاريع بتكبر بعملائها الدائمين" : "Made for your kind of business"}</p><span className="text-xs text-neutral-500">{arabic ? "٤ أنشطة. هدف واحد: يرجعوا تاني." : "Four industries. One reason to return."}</span></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">{businesses.map(({icon:Icon,name,text}) => <article key={name} className="rounded-2xl border border-[#526b5e]/15 bg-white/80 p-4 transition-colors hover:border-[#526b5e]/35 hover:bg-white sm:p-6"><span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf0e9] text-[#526b5e]"><Icon aria-hidden="true" size={22} strokeWidth={1.6}/></span><h3 className="text-base font-semibold text-neutral-900 sm:text-lg">{name}</h3><p className="mt-2 max-w-56 text-xs leading-6 text-neutral-600 sm:text-sm">{text}</p></article>)}</div>
  </div>;
}
