import { env } from "../config/env";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";

export const pool = new Pool({ connectionString: env.databaseUrl });
const database = drizzle(pool, { schema });
type Transaction = Parameters<Parameters<typeof database.transaction>[0]>[0];
const requestTransaction = new AsyncLocalStorage<Transaction>();

// All ORM calls in an authenticated request share the actor and transaction.
export const db = new Proxy(database, {
  get(target, property) {
    const executor = requestTransaction.getStore() ?? target;
    const value = Reflect.get(executor, property);
    return typeof value === "function" ? value.bind(executor) : value;
  },
});

export async function withAuditActor<T>(actorId: string, work: () => Promise<T>) {
  return database.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('cinegen.actor_id', ${actorId}, true)`);
    return requestTransaction.run(tx, work);
  });
}
