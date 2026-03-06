import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(8080),
    BETTER_AUTH_URL: z.url().default("http://localhost:8080"),
    BETTER_AUTH_SECRET: z.string(),
    DATABASE_URL: z.string(),
    CLIENT_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;
