import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { env } from "../config/env.js";
import { prisma } from "./database.js";

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.CLIENT_URL],
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [openAPI()],
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            domain: env.NODE_ENV === "production" ? env.SUBDOMAIN : undefined,
        },
    },
});
