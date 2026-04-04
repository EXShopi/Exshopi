import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { db } from '../backend/database';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_INITIAL_PASSWORD || '';

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    children: [
      { name: 'Laptops', slug: 'laptops' },
      { name: 'Mobiles', slug: 'mobiles' },
      { name: 'Tablets', slug: 'tablets' },
      { name: 'Accessories', slug: 'accessories' },
      { name: 'Used / Refurbished Devices', slug: 'used-refurbished-devices' },
    ],
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    children: [],
  },
  {
    name: 'Gifts',
    slug: 'gifts',
    children: [],
  },
  {
    name: 'Daily Use Products',
    slug: 'daily-use-products',
    children: [],
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    children: [
      { name: 'Men Clothing', slug: 'men-clothing' },
      { name: 'Footwear', slug: 'footwear' },
    ],
  },
];

async function upsertUser(input: {
  email: string;
  name: string;
  role: 'customer' | 'seller' | 'admin' | 'finance_manager' | 'support_agent' | 'super_admin';
  phone?: string;
  status?: 'active' | 'pending' | 'suspended';
}) {
  if (!DEFAULT_PASSWORD) {
    throw new Error('SEED_INITIAL_PASSWORD must be set before running prisma:seed');
  }
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
      phone: input.phone || '',
      status: input.status || 'active',
      emailVerified: true,
      country: 'AE',
      passwordHash,
    },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      phone: input.phone || '',
      status: input.status || 'active',
      emailVerified: true,
      country: 'AE',
      passwordHash,
    },
  });
}

async function upsertStore(input: {
  sellerUserId: string;
  storeName: string;
  slug: string;
  isOfficial?: boolean;
}) {
  return prisma.store.upsert({
    where: { slug: input.slug },
    update: {
      sellerUserId: input.sellerUserId,
      storeName: input.storeName,
      description:
        'Official ExShopi storefront for first-party marketplace products, launches, and curated UAE marketplace picks.',
      logoUrl: '/logo.png',
      bannerUrl: '/hero/hero-1.png',
      supportEmail: 'official@exshopi.com',
      supportPhone: '+971522608063',
      email: 'official@exshopi.com',
      country: 'UAE',
      emirate: 'Dubai',
      city: 'Dubai',
      warehouseAddress: 'ExShopi Fulfillment Center, Dubai',
      accountHolder: 'ExShopi Official',
      verified: true,
      trustScore: 100,
      isOfficial: Boolean(input.isOfficial),
      monthlyFeeAed: 0,
      subscriptionStatus: 'active',
      status: 'active',
    },
    create: {
      sellerUserId: input.sellerUserId,
      storeName: input.storeName,
      slug: input.slug,
      description:
        'Official ExShopi storefront for first-party marketplace products, launches, and curated UAE marketplace picks.',
      logoUrl: '/logo.png',
      bannerUrl: '/hero/hero-1.png',
      supportEmail: 'official@exshopi.com',
      supportPhone: '+971522608063',
      email: 'official@exshopi.com',
      country: 'UAE',
      emirate: 'Dubai',
      city: 'Dubai',
      warehouseAddress: 'ExShopi Fulfillment Center, Dubai',
      accountHolder: 'ExShopi Official',
      verified: true,
      trustScore: 100,
      isOfficial: Boolean(input.isOfficial),
      monthlyFeeAed: 0,
      subscriptionStatus: 'active',
      status: 'active',
    },
  });
}

async function seedCategories() {
  for (const category of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        isActive: true,
      },
    });

    for (const child of category.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          parentId: parent.id,
          isActive: true,
        },
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          isActive: true,
        },
      });
    }
  }
}

async function seedSettings() {
  await prisma.setting.upsert({
    where: { key: 'site_settings' },
    update: {
      valueJson: db.getSiteSettings() as any,
    },
    create: {
      key: 'site_settings',
      valueJson: db.getSiteSettings() as any,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'marketplace_settings' },
    update: {
      valueJson: db.getMarketplaceSettings() as any,
    },
    create: {
      key: 'marketplace_settings',
      valueJson: db.getMarketplaceSettings() as any,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'banners' },
    update: {
      valueJson: db.getBanners() as any,
    },
    create: {
      key: 'banners',
      valueJson: db.getBanners() as any,
    },
  });
}

async function seedAuditLog(actorId: string) {
  await prisma.auditLog.create({
    data: {
      actorId,
      actorRole: 'system',
      entityType: 'system',
      entityId: 'seed',
      action: 'database_seeded',
      metadataJson: {
        createdRoles: ['super_admin', 'admin', 'finance_manager', 'support_agent'],
      } as any,
    },
  });
}

async function main() {
  const superAdmin = await upsertUser({
    email: 'ahsansajid295@gmail.com',
    name: 'ExShopi Super Admin',
    role: 'super_admin',
    phone: '+971522608063',
  });

  await upsertUser({
    email: 'admin@exshopi.com',
    name: 'ExShopi Admin',
    role: 'admin',
    phone: '+971500000001',
  });

  await upsertUser({
    email: 'finance@exshopi.com',
    name: 'ExShopi Finance Manager',
    role: 'finance_manager',
    phone: '+971500000002',
  });

  await upsertUser({
    email: 'support@exshopi.com',
    name: 'ExShopi Support Agent',
    role: 'support_agent',
    phone: '+971500000003',
  });

  const officialUser = await upsertUser({
    email: 'official@exshopi.com',
    name: 'ExShopi Official',
    role: 'admin',
    phone: '+971522608063',
  });

  await upsertStore({
    sellerUserId: officialUser.id,
    storeName: 'ExShopi Official',
    slug: 'exshopi-official',
    isOfficial: true,
  });

  await seedCategories();
  await seedSettings();
  await seedAuditLog(superAdmin.id);

  console.log(
    JSON.stringify(
      {
        success: true,
        users: [
          'ahsansajid295@gmail.com',
          'admin@exshopi.com',
          'finance@exshopi.com',
          'support@exshopi.com',
          'official@exshopi.com',
        ],
        store: 'exshopi-official',
        categories: categories.map((category) => category.slug),
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
