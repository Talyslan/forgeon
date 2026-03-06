import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth";
import { ErrorSchema } from "../schemas/errors.schema";
import {
    GetStatsParamsSchema,
    GetStatsResponseSchema,
} from "../schemas/stats.schema";
import { GetStats } from "../use-cases/stats/get-stats";
import { NotFoundError } from "../util/errors";

export default async function StatsRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "GET",
        url: "/",
        schema: {
            tags: ["Stats"],
            summary: "Get workout statistics for the user",
            querystring: GetStatsParamsSchema,
            response: {
                200: GetStatsResponseSchema,
                401: ErrorSchema,
                404: ErrorSchema,
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

                const getStats = new GetStats();
                const result = await getStats.execute({
                    userId: session.user.id,
                    from: req.query.from,
                    to: req.query.to,
                });

                return res.status(200).send(result);
            } catch (error) {
                app.log.error(error);

                if (error instanceof NotFoundError) {
                    return res.status(404).send({
                        error: error.message,
                        code: "NOT_FOUND_ERROR",
                    });
                }

                return res.status(500).send({
                    error: "Internal Server Error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });
}
