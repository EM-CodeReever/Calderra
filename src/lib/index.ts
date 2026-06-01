// place files you want to import through the `$lib` alias in this folder.
import { PrismaClient } from "$prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "prisma/config";

const adapter = new PrismaPg({
  connectionString: env("DATABASE_URL"),
});

export const prisma = new PrismaClient({ adapter });
