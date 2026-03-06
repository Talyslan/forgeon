import type { FastifyInstance } from "fastify";

export default async function SwaggerRoute(app: FastifyInstance) {
    app.route({
        method: "GET",
        url: "/",
        schema: {
            hide: true
        },
        handler: async () => {
            return app.swagger()
        }
    })
} 