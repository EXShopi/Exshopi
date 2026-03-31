import { useMemo, useState } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Headphones,
  Gamepad2,
  Camera,
  Tv,
  Package,
  ChevronRight,
} from "lucide-react";

const departments = [
  {
    id: "laptops",
    label: "Laptops",
    icon: Laptop,
    groups: [
      {
        title: "Computers & Laptops",
        items: ["MacBooks", "Windows Laptops", "Gaming Laptops", "Monitors", "Keyboards", "Mouse"],
      },
      {
        title: "Top Laptop Brands",
        items: ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer"],
      },
      {
        title: "Accessories",
        items: ["Laptop Bags", "Cooling Pads", "Docking Stations", "Adapters", "Chargers", "USB Hubs"],
      },
      {
        title: "Popular Choices",
        items: ["Business Laptops", "Student Laptops", "Refurbished Laptops", "Budget Laptops", "Premium Models"],
      },
    ],
  },
  {
    id: "mobiles",
    label: "Mobiles",
    icon: Smartphone,
    groups: [
      {
        title: "Mobiles & Tablets",
        items: ["iPhone", "Samsung", "Xiaomi", "OnePlus", "Google Pixel", "Nokia"],
      },
      {
        title: "Mobile Accessories",
        items: ["Cases", "Screen Protectors", "Chargers", "Power Banks", "Cables", "Car Mounts"],
      },
      {
        title: "Smart Devices",
        items: ["Smart Watches", "Fitness Bands", "Wireless Earbuds", "Portable Speakers"],
      },
      {
        title: "Popular Picks",
        items: ["Flagship Phones", "Budget Phones", "Used iPhones", "Android Phones", "Dual SIM Phones"],
      },
    ],
  },
  {
    id: "tablets",
    label: "Tablets",
    icon: Tablet,
    groups: [
      {
        title: "Tablet Categories",
        items: ["iPad", "Android Tablets", "Kids Tablets", "Drawing Tablets", "E-Readers"],
      },
      {
        title: "Popular Brands",
        items: ["Apple", "Samsung", "Lenovo", "Huawei", "Xiaomi"],
      },
      {
        title: "Tablet Accessories",
        items: ["Tablet Covers", "Stylus Pens", "Tablet Keyboards", "Chargers", "Stands"],
      },
      {
        title: "Use Cases",
        items: ["Study Tablets", "Office Tablets", "Entertainment Tablets", "Travel Tablets"],
      },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: Headphones,
    groups: [
      {
        title: "Accessories",
        items: ["Chargers", "Cables", "AirPods", "Headphones", "Power Banks", "Phone Cases"],
      },
      {
        title: "Audio",
        items: ["Bluetooth Earbuds", "Gaming Headsets", "Portable Speakers", "Studio Headphones"],
      },
      {
        title: "Computer Accessories",
        items: ["Mouse", "Keyboard", "Webcams", "USB Hubs", "SSD Enclosures"],
      },
      {
        title: "Daily Tech",
        items: ["Adapters", "Smart Plugs", "Tripods", "Microphones", "Memory Cards"],
      },
    ],
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: Gamepad2,
    groups: [
      {
        title: "Gaming",
        items: ["Gaming Laptops", "Gaming Consoles", "Controllers", "Gaming Chairs", "Gaming Monitors"],
      },
      {
        title: "PC Gaming",
        items: ["Mechanical Keyboards", "Gaming Mouse", "Mouse Pads", "RGB Accessories"],
      },
      {
        title: "Console Gaming",
        items: ["PlayStation", "Xbox", "Nintendo", "Games", "Accessories"],
      },
      {
        title: "Popular Picks",
        items: ["Budget Gaming", "Pro Gaming", "Streaming Setup", "Starter Kits"],
      },
    ],
  },
  {
    id: "cameras",
    label: "Cameras",
    icon: Camera,
    groups: [
      {
        title: "Cameras",
        items: ["DSLR", "Mirrorless", "Action Cameras", "Instant Cameras", "Webcams"],
      },
      {
        title: "Camera Accessories",
        items: ["Tripods", "Batteries", "Lenses", "Camera Bags", "Lighting", "Memory Cards"],
      },
      {
        title: "Content Creator",
        items: ["Microphones", "Ring Lights", "Capture Cards", "Streaming Cameras"],
      },
      {
        title: "Popular Uses",
        items: ["Vlogging", "Photography", "Studio Setup", "Travel Cameras"],
      },
    ],
  },
  {
    id: "home",
    label: "Home Appliances",
    icon: Tv,
    groups: [
      {
        title: "Home & Daily Use",
        items: ["Kitchen", "Beauty", "Gifts", "Home Essentials", "Small Appliances", "Personal Care"],
      },
      {
        title: "Appliances",
        items: ["Blenders", "Irons", "Vacuum Cleaners", "Air Fryers", "Kettles", "Microwaves"],
      },
      {
        title: "Daily Essentials",
        items: ["Organizers", "Bathroom Items", "Cleaning Tools", "Storage Boxes"],
      },
      {
        title: "Popular Collections",
        items: ["Home Deals", "Beauty Essentials", "Gift Picks", "Kitchen Must-Haves"],
      },
    ],
  },
  {
    id: "daily",
    label: "Daily Use Products",
    icon: Package,
    groups: [
      {
        title: "Daily Use Products",
        items: ["Personal Care", "Beauty", "Gifts", "Home Items", "Travel Essentials", "Lifestyle"],
      },
      {
        title: "Popular Brands",
        items: ["Local Brands", "Imported Essentials", "Trending Products", "Best Sellers"],
      },
      {
        title: "Shop by Need",
        items: ["For Home", "For Office", "For Travel", "For Gifting"],
      },
      {
        title: "Top Choices",
        items: ["Budget Picks", "Everyday Deals", "Trending Now", "Top Rated"],
      },
    ],
  },
];

export default function MegaMenu() {
  const [activeDepartment, setActiveDepartment] = useState(departments[0].id);

  const activeData = useMemo(
    () => departments.find((item) => item.id === activeDepartment) ?? departments[0],
    [activeDepartment]
  );

  return (
    <section className="mx-auto mt-6 max-w-[1800px] px-4 md:px-6">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[300px,1fr]">
          <aside className="border-b border-slate-200 bg-slate-950 p-5 text-white lg:border-b-0 lg:border-r lg:border-slate-800">
            <h3 className="mb-4 text-lg font-black">Shop by Department</h3>

            <div className="space-y-2">
              {departments.map((item) => {
                const Icon = item.icon;
                const isActive = activeDepartment === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveDepartment(item.id)}
                    onClick={() => setActiveDepartment(item.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                      isActive ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="bg-slate-50 p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-2xl font-black text-slate-900">{activeData.label}</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Explore curated categories and marketplace products for {activeData.label.toLowerCase()}.
                </p>
              </div>

              <a
                href="/categories"
                className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100 md:inline-flex"
              >
                View All
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {activeData.groups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h5 className="mb-4 text-base font-black text-slate-900">{group.title}</h5>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <a
                        key={item}
                        href="#"
                        className="block text-sm text-slate-600 transition hover:text-slate-950"
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                  <a
                    href="#"
                    className="mt-4 inline-flex text-sm font-bold text-slate-900 hover:text-slate-700"
                  >
                    More {group.title} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}