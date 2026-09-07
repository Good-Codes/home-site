import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@goodcode.local")
    .trim()
    .toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    console.info(
      "Skipping admin seed: set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (min 12 chars).",
    );
    return;
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    select: { email: true },
  });
  if (existingAdmin) {
    console.info(`Admin already exists: ${existingAdmin.email}`);
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.info(`User already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name: "Good Code Admin",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.info(`Created bootstrap admin ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
