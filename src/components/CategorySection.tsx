import { Link } from "react-router-dom";
import { useState } from "react";

type Category = {
  name: string;
  link: string;
  images: string[];
};

const categories: Category[] = [
  {
    name: "Computers",
    link: "/products?category=computers",
    images: [
      "/Category%20Card/Computer.webp",
      "/Category%20Card/computer.webp",
      "/Category%20Card/Laptop.webp",
      "/Category%20Card/laptop.webp",
      "/Category%20Card/Computers.webp",
      "/Category%20Card/computers.webp",
    ],
  },
  {
    name: "Cell Phones",
    link: "/products?category=mobiles",
    images: [
      "/Category%20Card/Mobile.webp",
      "/Category%20Card/mobile.webp",
      "/Category%20Card/Cellphone.webp",
      "/Category%20Card/cellphone.webp",
      "/Category%20Card/Cell Phones.webp",
    ],
  },
  {
    name: "TVs / Video",
    link: "/products?category=tv",
    images: [
      "/Category%20Card/TV.webp",
      "/Category%20Card/tv.webp",
      "/Category%20Card/TVs.webp",
      "/Category%20Card/tvs.webp",
      "/Category%20Card/Video.webp",
      "/Category%20Card/video.webp",
    ],
  },
  {
    name: "Video Games",
    link: "/products?category=gaming",
    images: [
      "/Category%20Card/Gaming.webp",
      "/Category%20Card/gaming.webp",
      "/Category%20Card/Video Games.webp",
      "/Category%20Card/video-games.webp",
      "/Category%20Card/Game.webp",
      "/Category%20Card/game.webp",
    ],
  },
  {
    name: "Tshirts & Clothing",
    link: "/products?category=clothing",
    images: [
      "/Category%20Card/Clothing.webp",
      "/Category%20Card/clothing.webp",
      "/Category%20Card/Fashion.webp",
      "/Category%20Card/fashion.webp",
      "/Category%20Card/Tshirts.webp",
      "/Category%20Card/tshirts.webp",
    ],
  },
  {
    name: "Cameras & Photo",
    link: "/products?category=camera",
    images: [
      "/Category%20Card/Camera.webp",
      "/Category%20Card/camera.webp",
      "/Category%20Card/Cameras.webp",
      "/Category%20Card/cameras.webp",
      "/Category%20Card/Photo.webp",
      "/Category%20Card/photo.webp",
    ],
  },
  {
    name: "Kitchen Appliances",
    link: "/products?category=kitchen",
    images: [
      "/Category%20Card/Kitchen.webp",
      "/Category%20Card/kitchen.webp",
      "/Category%20Card/Kitchen Appliances.webp",
      "/Category%20Card/kitchen-appliances.webp",
    ],
  },
  {
    name: "Projectors",
    link: "/products?category=projector",
    images: [
      "/Category%20Card/Projector.webp",
      "/Category%20Card/projector.webp",
      "/Category%20Card/Projectors.webp",
      "/Category%20Card/projectors.webp",
    ],
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
              <CategoryImage name={category.name} images={category.images} />
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