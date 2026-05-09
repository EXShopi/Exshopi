import { useState } from "react";
import { Link } from "react-router-dom";
import { homepageCategories } from "../data/homepageCategories";
import { OptimizedImage } from "./OptimizedImage";

function CategoryImage({ src, name }: { src: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || "E";

  return (
    <div className="relative flex h-[92px] items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-white via-blue-50 to-slate-100 md:h-[200px] md:rounded-[24px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_70%_65%,rgba(14,165,233,0.12),transparent_36%)]" />
      <div className="absolute grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-lg font-black text-blue-700 shadow-sm md:h-16 md:w-16 md:text-2xl">
        {initial}
      </div>
      {!imageFailed ? (
        <OptimizedImage
          src={src}
          alt={name}
          lazy={false}
          useWebP={false}
          width={120}
          height={120}
          className="relative z-10 max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </div>
  );
}

export default function CategorySection() {
  return (
    <section className="mx-auto mt-6 max-w-[1800px] px-4 md:mt-8 md:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {homepageCategories.map((category) => (
          <Link
            key={category.slug}
            to={category.link}
            className="group rounded-[22px] border border-slate-200 bg-[#f3f4f6] p-3.5 shadow-sm transition hover:shadow-md md:rounded-[26px] md:p-6"
          >
            <CategoryImage src={category.image} name={category.name} />

            <div className="mt-2.5 text-center text-[12px] font-semibold leading-4 text-slate-900 md:mt-4 md:text-[15px]">
              {category.name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
