import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Logger } from "drizzle-orm/logger";

// PGlite accepts raw Date parameters that the production adapter cannot send.
// Initialize the real adapter's serializers without opening a connection, then
// check its timestamp wire-format contract on compiled persistence-test queries.
const client = postgres();
drizzle(client);

export const postgresDateSerialization: Logger = {
  logQuery(_query, params) {
    for (const value of params) {
      if (value instanceof Date) {
        Buffer.byteLength(client.options.serializers[1184](value) as string);
      }
    }
  },
};
