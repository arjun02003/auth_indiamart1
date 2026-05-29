import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'asnexpo94@gmail.com' },
    update: {},
    create: {
      email: 'asnexpo94@gmail.com',
      password: hashedPassword,
      name: 'Rahul Khawas',
      phone: '9860514336',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  const salesAgent = await prisma.user.upsert({
    where: { email: 'sales@asnexpo.com' },
    update: {},
    create: {
      email: 'sales@asnexpo.com',
      password: await bcrypt.hash('Sales@123', 12),
      name: 'Sales Executive',
      phone: '8087987048',
      role: 'SALES_AGENT',
    },
  });
  console.log('✅ Sales agent created:', salesAgent.email);

  // ─── Products ──────────────────────────────────────────────────────────────
  const products = [
    {
      name: 'Dell Inspiron 15 Laptop',
      description: 'Intel Core i5, 8GB RAM, 512GB SSD, Windows 11 Pro',
      category: 'Laptops',
      sku: 'LAPTOP-DELL-I5-001',
      brand: 'Dell',
      model: 'Inspiron 15 3520',
      unitPrice: 55000,
      taxRate: 18,
      unit: 'Piece',
      specifications: { processor: 'Intel Core i5-1235U', ram: '8GB DDR4', storage: '512GB SSD', display: '15.6" FHD', os: 'Windows 11 Pro' },
    },
    {
      name: 'HP Laptop 15s',
      description: 'AMD Ryzen 5, 8GB RAM, 512GB SSD, Windows 11 Home',
      category: 'Laptops',
      sku: 'LAPTOP-HP-R5-001',
      brand: 'HP',
      model: '15s-eq3000AU',
      unitPrice: 49000,
      taxRate: 18,
      unit: 'Piece',
      specifications: { processor: 'AMD Ryzen 5 5500U', ram: '8GB DDR4', storage: '512GB SSD', display: '15.6" FHD', os: 'Windows 11 Home' },
    },
    {
      name: 'Lenovo IdeaPad Slim 3',
      description: 'Intel Core i3, 8GB RAM, 256GB SSD',
      category: 'Laptops',
      sku: 'LAPTOP-LEN-I3-001',
      brand: 'Lenovo',
      model: 'IdeaPad Slim 3',
      unitPrice: 38000,
      taxRate: 18,
      unit: 'Piece',
    },
    {
      name: 'HP LaserJet Pro M404dn',
      description: 'Monochrome Laser Printer, 38ppm, Duplex, Network Ready',
      category: 'Printers',
      sku: 'PRINTER-HP-404-001',
      brand: 'HP',
      model: 'LaserJet Pro M404dn',
      unitPrice: 22000,
      taxRate: 18,
      unit: 'Piece',
    },
    {
      name: 'Epson L3250 All-in-One Printer',
      description: 'Ink Tank Printer, Print, Scan, Copy, Wi-Fi',
      category: 'Printers',
      sku: 'PRINTER-EPS-L3250-001',
      brand: 'Epson',
      model: 'L3250',
      unitPrice: 14000,
      taxRate: 18,
      unit: 'Piece',
    },
    {
      name: 'Hikvision 4-Channel CCTV Kit',
      description: '4 Bullet Cameras, 1TB DVR, Full HD 1080p, Night Vision',
      category: 'CCTV Systems',
      sku: 'CCTV-HIK-4CH-001',
      brand: 'Hikvision',
      model: 'DS-7204HGHI-K1',
      unitPrice: 18000,
      taxRate: 18,
      unit: 'Set',
    },
    {
      name: 'Hikvision 8-Channel CCTV Kit',
      description: '8 Cameras, 2TB DVR, Full HD 1080p, Night Vision, Mobile View',
      category: 'CCTV Systems',
      sku: 'CCTV-HIK-8CH-001',
      brand: 'Hikvision',
      model: 'DS-7208HGHI-K2',
      unitPrice: 32000,
      taxRate: 18,
      unit: 'Set',
    },
    {
      name: 'TP-Link TL-SG1008D Switch',
      description: '8-Port Gigabit Desktop Switch, Unmanaged',
      category: 'Networking Equipment',
      sku: 'NET-TPLINK-8P-001',
      brand: 'TP-Link',
      model: 'TL-SG1008D',
      unitPrice: 2200,
      taxRate: 18,
      unit: 'Piece',
    },
    {
      name: 'Cisco RV160 VPN Router',
      description: '4-Port Gigabit VPN Router, Business Grade',
      category: 'Networking Equipment',
      sku: 'NET-CISCO-RV160-001',
      brand: 'Cisco',
      model: 'RV160',
      unitPrice: 15000,
      taxRate: 18,
      unit: 'Piece',
    },
    {
      name: 'Windows 11 Pro License',
      description: 'Genuine Microsoft Windows 11 Pro OEM Key',
      category: 'Software Installation',
      sku: 'SW-WIN11-PRO-001',
      brand: 'Microsoft',
      model: 'Windows 11 Pro',
      unitPrice: 8000,
      taxRate: 18,
      unit: 'License',
    },
    {
      name: 'Microsoft Office 2021 Home & Business',
      description: 'Word, Excel, PowerPoint, Outlook - Lifetime License',
      category: 'Software Installation',
      sku: 'SW-MS365-HB-001',
      brand: 'Microsoft',
      model: 'Office 2021 H&B',
      unitPrice: 12000,
      taxRate: 18,
      unit: 'License',
    },
    {
      name: 'Annual Maintenance Contract (AMC)',
      description: 'Comprehensive AMC for computers and peripherals, unlimited visits',
      category: 'Annual Maintenance Contracts',
      sku: 'SVC-AMC-COMP-001',
      brand: 'ASN Expo',
      model: 'Standard AMC',
      unitPrice: 5000,
      taxRate: 18,
      unit: 'System/Year',
    },
    {
      name: 'Computer Repair Service',
      description: 'On-site hardware/software repair service',
      category: 'Computer Repair Services',
      sku: 'SVC-REPAIR-001',
      brand: 'ASN Expo',
      model: 'Repair Service',
      unitPrice: 500,
      taxRate: 18,
      unit: 'Visit',
    },
    {
      name: 'RAM Upgrade - 8GB DDR4',
      description: '8GB DDR4 2666MHz RAM Module Installation',
      category: 'Hardware Upgrades',
      sku: 'HW-RAM-8GB-001',
      brand: 'Kingston',
      model: 'KVR26N19S8/8',
      unitPrice: 2500,
      taxRate: 18,
      unit: 'Piece',
    },
    {
      name: 'SSD Upgrade - 512GB',
      description: '512GB SATA SSD with Data Migration Service',
      category: 'Hardware Upgrades',
      sku: 'HW-SSD-512-001',
      brand: 'Kingston',
      model: 'SA400S37/512G',
      unitPrice: 4500,
      taxRate: 18,
      unit: 'Piece',
    },
    {
      name: 'Logitech Wireless Mouse & Keyboard Combo',
      description: 'MK220 Wireless Combo Set',
      category: 'Computer Accessories',
      sku: 'ACC-LOG-MK220-001',
      brand: 'Logitech',
      model: 'MK220',
      unitPrice: 1500,
      taxRate: 18,
      unit: 'Set',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }
  console.log(`✅ ${products.length} products seeded`);

  // ─── Sample Leads ──────────────────────────────────────────────────────────
  const sampleLeads = [
    {
      name: 'Suresh Patel',
      email: 'suresh.patel@techfirm.com',
      phone: '9876543210',
      company: 'TechFirm Solutions',
      city: 'Pune',
      state: 'Maharashtra',
      source: 'INDIAMART' as const,
      status: 'NEW' as const,
      temperature: 'HOT' as const,
      qualificationScore: 82,
      indiamartQuery: 'Need 20 laptops for new office setup',
      budget: '10-15 Lakh',
      quantity: '20',
      urgency: 'HIGH',
      purchaseIntent: 'HIGH',
      companyType: 'SME',
      assignedToId: admin.id,
    },
    {
      name: 'Priya Sharma',
      email: 'priya@retailco.in',
      phone: '9123456789',
      company: 'RetailCo India',
      city: 'Nagpur',
      state: 'Maharashtra',
      source: 'INDIAMART' as const,
      status: 'QUOTATION_SENT' as const,
      temperature: 'WARM' as const,
      qualificationScore: 65,
      indiamartQuery: 'CCTV camera 8 channel for shop',
      budget: '30-40k',
      quantity: '1 Set',
      urgency: 'MEDIUM',
      purchaseIntent: 'MEDIUM',
      companyType: 'SME',
      assignedToId: admin.id,
    },
    {
      name: 'Amit Desai',
      email: 'amit.desai@startup.com',
      phone: '8765432109',
      company: 'InnoStart Pvt Ltd',
      city: 'Mumbai',
      state: 'Maharashtra',
      source: 'EMAIL' as const,
      status: 'FOLLOW_UP' as const,
      temperature: 'WARM' as const,
      qualificationScore: 58,
      indiamartQuery: 'Office networking setup for 30 users',
      budget: '2-3 Lakh',
      quantity: '30 users',
      urgency: 'MEDIUM',
      purchaseIntent: 'MEDIUM',
      companyType: 'STARTUP',
      assignedToId: salesAgent.id,
    },
    {
      name: 'Kavita Joshi',
      email: 'kavita@school.edu',
      phone: '9988776655',
      company: 'Sunrise Public School',
      city: 'Wardha',
      state: 'Maharashtra',
      source: 'INDIAMART' as const,
      status: 'CONTACTED' as const,
      temperature: 'COLD' as const,
      qualificationScore: 35,
      indiamartQuery: 'Desktop computers for computer lab',
      budget: 'Not specified',
      quantity: '15',
      urgency: 'LOW',
      purchaseIntent: 'LOW',
      companyType: 'GOVERNMENT',
      assignedToId: salesAgent.id,
    },
    {
      name: 'Rohit Mehta',
      email: 'rohit@enterprise.co.in',
      phone: '7896541230',
      company: 'Mehta Enterprises',
      city: 'Nagpur',
      state: 'Maharashtra',
      source: 'WHATSAPP' as const,
      status: 'CONVERTED' as const,
      temperature: 'HOT' as const,
      qualificationScore: 91,
      budget: '5-6 Lakh',
      quantity: '10 systems',
      urgency: 'HIGH',
      purchaseIntent: 'HIGH',
      companyType: 'ENTERPRISE',
      assignedToId: admin.id,
      convertedAt: new Date(),
    },
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.create({ data: lead });
  }
  console.log(`✅ ${sampleLeads.length} sample leads seeded`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Admin Login: asnexpo94@gmail.com');
  console.log('🔑 Admin Password: Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
