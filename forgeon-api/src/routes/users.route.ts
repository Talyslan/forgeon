import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth.js";
import { ErrorSchema } from "../schemas/errors.schema.js";
import {
    UpsertUserTrainDataBodySchema,
    UserTrainDataSchema,
} from "../schemas/user.schema.js";
import { GetUserTrainData } from "../use-cases/users/get-user-train-data.js";
import { UpsertUserTrainData } from "../use-cases/users/upsert-user-train-data.js";

export default async function UserRoutes(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "GET",
        url: "/me",
        schema: {
            operationId: "getUserTrainData",
            tags: ["Users"],
            summary: "Get current user train data",
            response: {
                200: UserTrainDataSchema,
                401: ErrorSchema,
            },
        },
        handler: async (req, res) => {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session) {
                return res
                    .status(401)
                    .send({ error: "Unauthorized", code: "UNAUTHORIZED" });
            }

            const getUserTrainData = new GetUserTrainData();
            const data = await getUserTrainData.execute({
                userId: session.user.id,
            });

            return res.status(200).send(data);
        },
    });

    app.withTypeProvider<ZodTypeProvider>().route({
        method: "PUT",
        url: "/me",
        schema: {
            operationId: "upsertUserTrainData",
            tags: ["Users"],
            summary: "Upsert user (me) train data",
            body: UpsertUserTrainDataBodySchema,
            response: {
                200: UserTrainDataSchema,
                401: ErrorSchema,
                500: ErrorSchema,
            },
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers),
                });
                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED",
                    });
                }

                const upsertUserTrainData = new UpsertUserTrainData();
                const result = await upsertUserTrainData.execute({
                    userId: session.user.id,
                    weightInGrams: request.body.weightInGrams,
                    heightInCentimeters: request.body.heightInCentimeters,
                    age: request.body.age,
                    bodyFatPercentage: request.body.bodyFatPercentage,
                });

                return reply.status(200).send(result);
            } catch (error) {
                app.log.error(error);
                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });
}
