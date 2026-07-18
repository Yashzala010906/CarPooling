import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * bcrypt hash of "Password123!" (cost 10), precomputed so this package does not
 * need a bcrypt dependency. All demo accounts share this password.
 */
const DEMO_PASSWORD_HASH = '$2b$10$k30jwWREiVbzy5Eo6m7rLOONWqoZ1qtrblamBK4Iui3LbHlvclaF6';

async function main() {
  const company = await prisma.company.upsert({
    where: { code: 'ACME' },
    update: {},
    create: { name: 'Acme Corp', code: 'ACME' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.test' },
    update: {},
    create: {
      companyId: company.id,
      role: UserRole.COMPANY_ADMIN,
      email: 'admin@acme.test',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Alex',
      lastName: 'Admin',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@acme.test' },
    update: {},
    create: {
      companyId: company.id,
      role: UserRole.EMPLOYEE,
      email: 'driver@acme.test',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Dana',
      lastName: 'Driver',
      phone: '+91 90000 00001',
    },
  });

  const passenger = await prisma.user.upsert({
    where: { email: 'passenger@acme.test' },
    update: {},
    create: {
      companyId: company.id,
      role: UserRole.EMPLOYEE,
      email: 'passenger@acme.test',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Pat',
      lastName: 'Passenger',
      phone: '+91 90000 00002',
    },
  });

  await prisma.vehicle.upsert({
    where: { registrationNumber: 'KSC-4921' },
    update: {},
    create: {
      ownerId: driver.id,
      model: 'Tesla Model 3',
      registrationNumber: 'KSC-4921',
      seatingCapacity: 5,
      fuelType: 'Electric',
    },
  });

  await prisma.vehicle.upsert({
    where: { registrationNumber: 'GTH-8832' },
    update: {},
    create: {
      ownerId: driver.id,
      model: 'Audi A4',
      registrationNumber: 'GTH-8832',
      seatingCapacity: 4,
      fuelType: 'Petrol',
      mileageKmPerLitre: 14.5,
    },
  });

  console.log('Seeded:', {
    company: company.code,
    users: [admin.email, driver.email, passenger.email],
    vehicles: ['KSC-4921', 'GTH-8832'],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
