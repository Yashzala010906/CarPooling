import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // TODO: seed a demo company, an admin, and a couple of employees.
  // Example:
  // await prisma.company.upsert({
  //   where: { code: 'ACME' },
  //   update: {},
  //   create: { name: 'Acme Corp', code: 'ACME' },
  // });
  console.log('Seed placeholder — implement in prisma/seed.ts');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
