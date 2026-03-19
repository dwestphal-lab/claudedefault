import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrator",
      role: Role.ADMIN,
    },
  });

  // Normal Users
  const users = await Promise.all(
    [
      { email: "max.mustermann@example.com", name: "Max Mustermann" },
      { email: "erika.musterfrau@example.com", name: "Erika Musterfrau" },
      { email: "test@example.com", name: "Test User" },
    ].map((data) =>
      prisma.user.upsert({
        where: { email: data.email },
        update: {},
        create: { ...data, role: Role.USER },
      })
    )
  );

  // Audit Log Beispiele
  await prisma.auditLog.createMany({
    data: [
      {
        action: "CREATE",
        entity: "User",
        entityId: admin.id,
        userId: admin.id,
        newValue: { email: admin.email, name: admin.name, role: admin.role },
      },
      ...users.map((u) => ({
        action: "CREATE" as const,
        entity: "User",
        entityId: u.id,
        userId: admin.id,
        newValue: { email: u.email, name: u.name, role: u.role },
      })),
    ],
    skipDuplicates: true,
  });

  console.log(`Seeded: ${1 + users.length} users, ${1 + users.length} audit logs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
