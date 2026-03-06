import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { env } from "../config/env";
import { prisma } from "./database";

export const auth = betterAuth({
    trustedOrigins: [env.CLIENT_URL],
    emailAndPassword: {
        enabled: true,
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [openAPI()],
});
