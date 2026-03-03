import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
    PORT: z
        .coerce.number()
        .default(8080)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;
