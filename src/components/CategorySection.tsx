import { Link } from "react-router-dom";
import { useState } from "react";

type CategoryItem = {
  name: string;
  link: string;
  imageCandidates: string[];
};

const categories: CategoryItem[] = [
  {
    name: "Computers",
    link: "/products?category=computers",
    imageCandidates: [
      "/categories/computer.png",
      "/categories/computer.webp",
      "/categories/computers.png",
      "/categories/computers.webp",
      "/Category%20Card/Computer.webp",
      "/Category%20Card/computer.webp",
      "/Category%20Card/Laptop.webp",
      "/Category%20Card/laptop.webp",
    ],
  },
  {
    name: "Cell Phones",
    link: "/products?category=mobiles",
    imageCandidates: [
      "/categories/cellphone.png",
      "/categories/cellphone.webp",
      "/categories/mobile.png",
      "/categories/mobile.webp",
      "/categories/mobiles.png",
      "/categories/mobiles.webp",
      "/Category%20Card/Mobile.webp",
      "/Category%20Card/mobile.webp",
    ],
  },
  {
    name: "TVs / Video",
    link: "/products?category=tv",
    imageCandidates: [
      "/categories/tv.png",
      "/categories/tv.webp",
      "/categories/tvs.png",
      "/categories/tvs.webp",
      "/categories/video.png",
      "/categories/video.webp",
      "/Category%20Card/tv.webp",
      "/Category%20Card/TV.webp",
    ],
  },
  {
    name: "Video Games",
    link: "/products?category=gaming",
    imageCandidates: [
      "/categories/gaming.png",
      "/categories/gaming.webp",
      "/categories/game.png",
      "/categories/game.webp",
      "/Category%20Card/gaming.webp",
      "/Category%20Card/Gaming.webp",
    ],
  },
  {
    name: "Tshirts & Clothing",
    link: "/products?category=clothing",
    imageCandidates: [
      "/categories/clothing.png",
      "/categories/clothing.webp",
      "/categories/tshirts-clothing.png",
      "/categories/tshirts-clothing.webp",
      "/categories/fashion.png",
      "/categories/fashion.webp",
      "/Category%20Card/clothing.webp",
      "/Category%20Card/fashion.webp",
    ],
  },
  {
    name: "Cameras & Photo",
    link: "/products?category=camera",
    imageCandidates: [
      "/categories/camera.png",
      "/categories/camera.webp",
      "/categories/cameras.png",
      "/categories/cameras.webp",
      "/Category%20Card/camera.webp",
      "/Category%20Card/Camera.webp",
    ],
  },
  {
    name: "Kitchen Appliances",
    link: "/products?category=kitchen",
    imageCandidates: [
      "/categories/kitchen-appliances.png",
      "/categories/kitchen-appliances.webp",
      "/categories/kitchen.png",
      "/categories/kitchen.webp",
      "/Category%20Card/kitchen.webp",
      "/Category%20Card/Kitchen.webp",
    ],
  },
  {
    name: "Projectors",
    link: "/products?category=projector",
    imageCandidates: [
      "/categories/projector.png",
      "/categories/projector.webp",
      "/categories/projectors.png",
      "/categories/projectors.webp",
      "/Category%20Card/projector.webp",
      "/Category%20Card/Projector.webp",
    ],
  },
];

function CategoryImage({
  alt,
  candidates,
}: {
  alt: string;
  candidates: string[];
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const currentSrc = candidates[index];

  if (!currentSrc || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-[16px] bg-transparent text-center text-xs font-semibold text-slate-400">
        {alt}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
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
              <CategoryImage
                alt={category.name}
                candidates={category.imageCandidates}
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