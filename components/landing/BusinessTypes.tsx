export default function BusinessTypes({ arabic = false }: { arabic?: boolean }) {
  const businesses = arabic ? ["كافيهات", "صالونات", "مغاسل عربيات", "مخابز"] : ["Cafés", "Salons", "Car washes", "Bakeries"];
  return (
    <div className="mt-10 border-t border-black/10 pt-6 sm:mt-12">
      <div className="grid gap-5 lg:grid-cols-[0.8fr_2fr] lg:items-center lg:gap-10">
        <p className="text-sm leading-6 text-neutral-500">{arabic ? "برنامج ولاء يناسب مشروعك" : "Loyalty for your business"}</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 sm:gap-x-8">
          {businesses.map(name => <li key={name} className="border-s-2 border-[#657d70]/35 ps-4 text-base font-medium text-neutral-800 sm:text-lg">{name}</li>)}
        </ul>
      </div>
    </div>
  );
}
