import { PrismaClient } from "@prisma/generated";

const globalForPrisma = global;

const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;
