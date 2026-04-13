import { Link } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";

const categories = [
  {
    name: "Computers",
    image: "/categories/computer.png",
    fallback: "/categories/computer.webp",
    link: "/products?category=computers",
  },
  {
    name: "Cell Phones",
    image: "/categories/cellphone.png",
    fallback: "/categories/cellphone.webp",
    link: "/products?category=mobiles",
  },
  {
    name: "TVs / Video",
    image: "/categories/tv.png",
    fallback: "/categories/tv.webp",
    link: "/products?category=tv",
  },
  {
    name: "Video Games",
    image: "/categories/gaming.png",
    fallback: "/categories/gaming.webp",
    link: "/products?category=gaming",
  },
  {
    name: "Tshirts & Clothing",
    image: "/categories/clothing.png",
    fallback: "/categories/clothing.webp",
    link: "/products?category=clothing",
  },
  {
    name: "Cameras & Photo",
    image: "/categories/camera.png",
    fallback: "/categories/camera.webp",
    link: "/products?category=camera",
  },
  {
    name: "Kitchen Appliances",
    image: "/categories/kitchen-appliances.png",
    fallback: "/categories/kitchen-appliances.webp",
    link: "/products?category=kitchen",
  },
  {
    name: "Projectors",
    image: "/categories/projector.png",
    fallback: "/categories/projector.webp",
    link: "/products?category=projector",
  },
];

export default function CategorySection() {
  const critical = new Set([
    "Computers",
    "TVs / Video",
    "Tshirts & Clothing",
    "Kitchen Appliances",
    "Projectors",
  ]);

  return (
    <section className="mx-auto mt-6 max-w-[1800px] px-4 md:mt-8 md:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            to={category.link}
            className="group rounded-[22px] border border-slate-200 bg-[#f3f4f6] p-3.5 shadow-sm transition hover:shadow-md md:rounded-[26px] md:p-6"
          >
            <div className="flex h-[92px] items-center justify-center md:h-[200px]">
              <OptimizedImage
                src={category.image}
                fallbackSrc={category.fallback}
                alt={category.name}
                lazy={!critical.has(category.name)}
                useWebP={false}
                className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
              />
            </div>

            <div className="mt-2.5 text-center text-[12px] font-semibold leading-4 text-slate-900 md:mt-4 md:text-[15px]">
              {category.name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}