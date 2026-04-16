// src/data/homepageCategories.ts
export const homepageCategories = [
  {
    slug: 'computers',
    name: 'Computers',
    image: '/categories/Computer.png',
    link: '/category/computers',
  },
  {
    slug: 'cell-phones',
    name: 'Cell Phones',
    image: '/categories/Cellphone.png',
    link: '/category/mobiles',
  },
  {
    slug: 'cameras',
    name: 'Cameras & Photo',
    image: '/categories/Camera.png',
    link: '/category/cameras',
  },
  {
    slug: 'fashion',
    name: 'Tshirts & Clothing',
    image: '/categories/Clothing.png',
    link: '/category/fashion',
  },
  {
    slug: 'tv-video',
    name: 'TVs / Video',
    image: '/categories/Tv.png',
    link: '/category/tv-video',
  },
  {
    slug: 'gaming',
    name: 'Video Games',
    image: '/categories/Gaming.png',
    link: '/category/gaming',
  },
  {
    slug: 'kitchen',
    name: 'Kitchen Appliances',
    image: '/categories/Kitchen_Appliances.png',
    link: '/category/home-appliances',
  },
  {
    slug: 'projectors',
    name: 'Projectors',
    image: '/categories/Projector.png',
    link: '/category/projectors',
  },
];

export function getHomepageCategory(slug: string) {
  return homepageCategories.find((cat) => cat.slug === slug);
}