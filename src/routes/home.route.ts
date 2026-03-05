import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth";
import { ErrorSchema } from "../schemas/errors.schema";
import {
    GetHomeParamsSchema,
    GetHomeResponseSchema,
} from "../schemas/home.schema";
import { GetHomeData } from "../use-cases/home/get-home-data";

export default async function HomeRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "GET",
        url: "/:date",
        schema: {
            tags: ["Home"],
            summary: "Get home page data",
            params: GetHomeParamsSchema,
            response: {
                200: GetHomeResponseSchema,
                401: ErrorSchema,
                500: ErrorSchema,
            },
        },
        handler: async (req, res) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(req.headers),
                });

                if (!session) {
                    return res.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED",
                    });
                }

                const getHomeData = new GetHomeData();
                const result = await getHomeData.execute({
                    userId: session.user.id,
                    date: req.params.date,
                });

                return res.status(200).send(result);
            } catch (error) {
                app.log.error(error);
                return res.status(500).send({
                    error: "Internal Server Error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });
}
