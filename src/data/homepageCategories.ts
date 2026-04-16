// src/data/homepageCategories.ts
export const homepageCategories = [
  {
    slug: 'computers',
    name: 'Computers',
    image: '/Category Card/Computer.png',
    link: '/category/computers',
  },
  {
    slug: 'cell-phones',
    name: 'Cell Phones',
    image: '/Category Card/Cellphone.png',
    link: '/category/mobiles',
  },
  {
    slug: 'cameras',
    name: 'Cameras & Photo',
    image: '/Category Card/Camera.png',
    link: '/category/cameras',
  },
  {
    slug: 'fashion',
    name: 'Tshirts & Clothing',
    image: '/Category Card/Clothing.png',
    link: '/category/fashion',
  },
  {
    slug: 'tv-video',
    name: 'TVs / Video',
    image: '/Category Card/Tv.png',
    link: '/category/tv-video',
  },
  {
    slug: 'gaming',
    name: 'Video Games',
    image: '/Category Card/Gaming.png',
    link: '/category/gaming',
  },
  {
    slug: 'kitchen',
    name: 'Kitchen Appliances',
    image: '/Category Card/Kitchen_Appliances.png',
    link: '/category/home-appliances',
  },
  {
    slug: 'projectors',
    name: 'Projectors',
    image: '/Category Card/Projector.png',
    link: '/category/projectors',
  },
];

export function getHomepageCategory(slug: string) {
  return homepageCategories.find((cat) => cat.slug === slug);
}