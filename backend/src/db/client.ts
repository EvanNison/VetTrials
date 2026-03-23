import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  host: "localhost",
  port: 5432,
  database: "vettrials",
  user: process.env.PGUSER || process.env.USER || "evannison",
});

const prisma = new PrismaClient({ adapter });

export default prisma;
