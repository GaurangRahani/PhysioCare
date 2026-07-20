import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import "dotenv/config";

const { Client } = pkg;

// 1. Set up the Postgres client to look for your .env file
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// 2. Open the connection to the database
await client.connect();

// 3. Wrap the connection in Drizzle and export it
export const db = drizzle(client);

console.log("✅ Successfully connected to the PhysioCare database!");
