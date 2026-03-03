import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export default async function Health(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "GET",
        url: "/",
        schema: {
            description: "Hello world",
            tags: ["Hello World"],
            response: {
                200: z.object({
                    message: z.string(),
                }),
            },
        },
        handler: () => {
            return { message: "Hello world" };
        },
    });
}
