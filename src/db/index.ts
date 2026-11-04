import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Réutilise la connexion en dev (hot reload de Next.js)
const globalForDb = globalThis as unknown as { client?: postgres.Sql };
const client = globalForDb.client ?? postgres(process.env.DATABASE_URL!);
if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
