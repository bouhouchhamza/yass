import { defineConfig } from "drizzle-kit";
export default defineConfig({ schema: "./lib/db/schema.ts", out: "./database/migrations", dialect: "sqlite" });
