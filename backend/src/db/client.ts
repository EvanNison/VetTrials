import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/vettrials";

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

export default prisma;
