import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    breakpoints: true,
    dbCredentials: {
        url: process.env.DATABASE_URL || "./rubigo.db",
    },
});
