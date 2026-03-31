const accessories = [
  {
    name: "Phone Covers",
    image: "/Accessories/phonecover.png",
    slug: "phone-covers",
    link: "/category/phone-covers",
  },
  {
    name: "Cables & Connectors",
    image: "/Accessories/cables&connector.png",
    slug: "cables-connectors",
    link: "/category/cables-connectors",
  },
  {
    name: "Keyboards & Mouse",
    image: "/Accessories/keyboard&mouse.png",
    slug: "keyboards-mouse",
    link: "/category/keyboards-mouse",
  },
  {
    name: "Hard Disk & Memory Cards",
    image: "/Accessories/harddisk.png",
    slug: "hard-disk-memory-cards",
    link: "/category/hard-disk-memory-cards",
  },
  {
    name: "Bags & Sleeves",
    image: "/Accessories/bag&sleeves.png",
    slug: "bags-sleeves",
    link: "/category/bags-sleeves",
  },
  {
    name: "True Wireless",
    image: "/Accessories/truewireless.png",
    slug: "true-wireless",
    link: "/category/true-wireless",
  },
];

export default function AccessoriesSection() {
  return (
    <section className="mx-auto mt-14 max-w-[1800px] px-4 md:px-6">
      <div className="rounded-[28px] bg-white px-6 py-8 shadow-sm ring-1 ring-slate-200 md:px-8">
        <h2 className="mb-8 text-center text-[30px] font-semibold text-slate-900 md:text-[36px]">
          Accessories
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {accessories.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className="group"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-500">
                <div className="mb-3 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-[80px] w-auto object-contain transition duration-300 group-hover:scale-110"
                  />
                </div>

                <p className="text-center text-sm font-semibold text-slate-700">
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