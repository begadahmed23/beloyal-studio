export default function BusinessTypes({ arabic = false }: { arabic?: boolean }) {
  const businesses = arabic ? ["كافيهات", "صالونات", "مغاسل عربيات", "مخابز"] : ["Cafés", "Salons", "Car washes", "Bakeries"];
  return <div className="mt-10 border-t border-black/10 pt-6 sm:mt-12">
    <p className="text-xs font-medium text-neutral-500">{arabic ? "مصمّم لمشروعك" : "Built for your business"}</p>
    <ul className="mt-4 flex flex-wrap gap-2 sm:gap-3">{businesses.map(name => <li key={name} className="rounded-full border border-black/15 bg-transparent px-5 py-2.5 text-sm font-medium text-neutral-900 sm:px-7 sm:text-base">{name}</li>)}</ul>
  </div>;
}
