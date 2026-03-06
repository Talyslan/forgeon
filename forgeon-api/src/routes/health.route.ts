import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export default async function HealthRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "GET",
        url: "/",
        schema: {
            description: "Health check",
            tags: ["Forgeon API Health"],
            response: {
                200: z.object({
                    message: z.string(),
                }),
            },
        },
        handler: () => {
            return { message: "Forgeon API is running!" };
        },
    });
}
