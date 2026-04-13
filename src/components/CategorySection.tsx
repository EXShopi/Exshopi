import { Link } from "react-router-dom";
import { useState } from "react";

type Category = {
  name: string;
  link: string;
  images: string[];
};

const categories = [
  {
    name: "Computers",
    image: "/categories/computer.png",
    link: "/products?category=computers",
  },
  {
    name: "Cell Phones",
    image: "/categories/cellphone.png",
    link: "/products?category=mobiles",
  },
  {
    name: "TVs / Video",
    image: "/categories/tv.png",
    link: "/products?category=tv",
  },
  {
    name: "Video Games",
    image: "/categories/gaming.png",
    link: "/products?category=gaming",
  },
  {
    name: "Tshirts & Clothing",
    image: "/categories/clothing.png",
    link: "/products?category=clothing",
  },
  {
    name: "Cameras & Photo",
    image: "/categories/camera.png",
    link: "/products?category=camera",
  },
  {
    name: "Kitchen Appliances",
    image: "/categories/kitchen-appliances.png",
    link: "/products?category=kitchen",
  },
  {
    name: "Projectors",
    image: "/categories/projector.png",
    link: "/products?category=projector",
  },
];

function CategoryImage({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <img
      src={images[index]}
      alt={name}
      loading="lazy"
      className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
      onError={() => {
        if (index < images.length - 1) {
          setIndex((prev) => prev + 1);
        } else {
          setHidden(true);
        }
      }}
    />
  );
}

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
<CategoryImage name={category.name} images={[category.image]} />            </div>

            <div className="mt-2.5 text-center text-[12px] font-semibold leading-4 text-slate-900 md:mt-4 md:text-[15px]">
              {category.name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}