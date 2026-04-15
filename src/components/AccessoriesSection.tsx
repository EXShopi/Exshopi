import OptimizedImage from "./OptimizedImage";
import { getCategoryPath } from "../lib/seo";

const accessories = [
  {
    name: "Phone Covers",
    image: "/Accessories/phonecover",
    slug: "phone-covers",
    link: getCategoryPath('phone-covers'),
  },
  {
    name: "Cables & Connectors",
    image: "/Accessories/cables&connector",
    slug: "cables-connectors",
    link: getCategoryPath('cables-connectors'),
  },
  {
    name: "Keyboards & Mouse",
    image: "/Accessories/keyboard&mouse",
    slug: "keyboards-mouse",
    link: getCategoryPath('keyboards-mouse'),
  },
  {
    name: "Hard Disk & Memory Cards",
    image: "/Accessories/harddisk",
    slug: "hard-disk-memory-cards",
    link: getCategoryPath('hard-disk-memory-cards'),
  },
  {
    name: "Bags & Sleeves",
    image: "/Accessories/bag&sleeves",
    slug: "bags-sleeves",
    link: getCategoryPath('bags-sleeves'),
  },
  {
    name: "True Wireless",
    image: "/Accessories/truewireless",
    slug: "true-wireless",
    link: getCategoryPath('true-wireless'),
  },
];

export default function AccessoriesSection() {
  return (
    <section className="mx-auto mt-10 max-w-[1800px] px-4 md:mt-14 md:px-6">
      <div className="rounded-[24px] bg-white px-4 py-5 shadow-sm ring-1 ring-slate-200 md:rounded-[28px] md:px-8 md:py-8">
        <h2 className="mb-5 text-center text-[22px] font-semibold text-slate-900 md:mb-8 md:text-[36px]">
          Accessories
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {accessories.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className="group"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-500 md:p-5">
                <div className="mb-2 flex items-center justify-center md:mb-3">
                  <OptimizedImage
                    src={item.image}
                    alt={item.name}
                    lazy={true}
                    useWebP={true}
                    className="h-[54px] w-auto object-contain transition duration-300 group-hover:scale-110 md:h-[80px]"
                  />
                </div>

                <p className="text-center text-[11px] font-semibold leading-4 text-slate-700 md:text-sm">
                  {item.name}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
