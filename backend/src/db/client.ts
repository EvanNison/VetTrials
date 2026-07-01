import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/vettrials";

// Let the adapter build its own connection pool from the config. Passing a
// pre-constructed pg.Pool trips a type mismatch because @prisma/adapter-pg
// bundles its own copy of @types/pg.
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
