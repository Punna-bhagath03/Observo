import "dotenv/config";

import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

console.log(process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
}

const pool = new pg.Pool({
    connectionString,
});

const adapter = new PrismaPg(pool);

export const prismaClient = new PrismaClient({
    adapter,
});