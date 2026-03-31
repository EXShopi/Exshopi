const categories = [
  {
    name: "Computers",
    image: "/categories/Computer.png",
    slug: "computers",
    link: "/categories/laptops",
  },
  {
    name: "Cell Phones",
    image: "/categories/Cellphone.png",
    link: "/categories/mobiles",
  },
  {
    name: "TVs / Video",
    image: "/categories/Tv.png",
    link: "/categories/tv-video",
  },
  {
    name: "Video Games",
    image: "/categories/Gaming.png",
    link: "/categories/gaming",
  },
  {
    name: "Coffee Makers",
    image: "/categories/Cofeemaker.png",
    link: "/categories/home-appliances",
  },
  {
    name: "Cameras & Photo",
    image: "/categories/Camera.png",
    link: "/categories/cameras",
  },
  {
    name: "Kitchen Appliances",
    image: "/categories/Kitchen_Appliances.png",
    link: "/categories/home-appliances",
  },
  {
    name: "Projectors",
    image: "/categories/Projector.png",
    link: "/categories/projectors",
  },
];

export default function CategorySection() {
  return (
    <section className="mx-auto mt-8 max-w-[1800px] px-4 md:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <a
            key={category.name}
            href={category.link}
            className="group rounded-[26px] border border-slate-200 bg-[#f3f4f6] p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-[180px] items-center justify-center md:h-[200px]">
              <img
                src={category.image}
                alt={category.name}
                className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
              />
            </div>

            <div className="mt-4 text-center text-[15px] font-semibold text-slate-900">
              {category.name}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}