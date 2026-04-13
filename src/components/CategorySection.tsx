import { Link } from "react-router-dom";

const categories = [
  {
    name: "Computers",
    image: "/categories/Computer.png",
    link: "/products?category=computers",
  },
  {
    name: "Cell Phones",
    image: "/categories/Cellphone.png",
    link: "/products?category=mobiles",
  },
  {
    name: "TVs / Video",
    image: "/categories/Tv.png",
    link: "/products?category=tv",
  },
  {
    name: "Video Games",
    image: "/categories/Gaming.png",
    link: "/products?category=gaming",
  },
  {
    name: "Tshirts & Clothing",
    image: "/categories/Clothing.png",
    link: "/products?category=clothing",
  },
  {
    name: "Cameras & Photo",
    image: "/categories/Camera.png",
    link: "/products?category=camera",
  },
  {
    name: "Kitchen Appliances",
    image: "/categories/Kitchen_Appliances.png",
    link: "/products?category=kitchen",
  },
  {
    name: "Projectors",
    image: "/categories/Projector.png",
    link: "/products?category=projector",
  },
];

export default function CategorySection() {
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
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                onError={(e) => {
                  console.error("Category image failed:", category.image);
                  e.currentTarget.style.display = "none";
                }}
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