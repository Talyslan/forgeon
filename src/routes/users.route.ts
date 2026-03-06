import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth";
import { ErrorSchema } from "../schemas/errors.schema";
import { UserTrainDataSchema } from "../schemas/user.schema";
import { GetUserTrainData } from "../use-cases/users/get-user-train-data";

export default async function UserRoutes(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "GET",
        url: "/me",
        schema: {
            tags: ["User"],
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
            const data = await getUserTrainData.execute(session.user.id);

            return res.status(200).send(data);
        },
    });
}
