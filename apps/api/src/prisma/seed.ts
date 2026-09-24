import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, TeamRole, UserStatus } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const seedTeam = await prisma.team.upsert({
    where: {
      id: "seed-team",
    },
    update: {},
    create: {
      id: "seed-team",
      name: "seed-team",
    },
  });
  const adminUser = await prisma.user.upsert({
    where: {
      email: "admin@example.com",
    },
    update: {},
    create: {
      email: "admin@example.com",
      name: "admin",
      passwordHash: await bcrypt.hash("12345678", 10),
    },
  });
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: seedTeam.id,
        userId: adminUser.id,
      },
    },
    update: { role: TeamRole.OWNER },
    create: {
      teamId: seedTeam.id,
      userId: adminUser.id,
      role: TeamRole.OWNER,
    },
  });
  const timezone = [
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Europe/Berlin",
    "America/Los_Angeles",
    "Asia/Mumbai",
  ];
  const status = [UserStatus.ONLINE, UserStatus.OFFLINE, UserStatus.BUSY];
  for (let i = 1; i <= 5; i++) {
    const seedUser = await prisma.user.upsert({
      where: {
        email: `seed${i}@example.com`,
      },
      update: {
        timezone: timezone[i - 1],
        status: status[i % 3],
        focus: `seed-user${i}-focus`,
      },
      create: {
        email: `seed${i}@example.com`,
        name: `seed-user${i}`,
        passwordHash: await bcrypt.hash("12345678", 10),
        timezone: timezone[i - 1],
        status: status[i % 3],
        focus: `seed-user${i}-focus`,
      },
    });
    await prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: seedTeam.id,
          userId: seedUser.id,
        },
      },
      update: {},
      create: {
        teamId: seedTeam.id,
        userId: seedUser.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
