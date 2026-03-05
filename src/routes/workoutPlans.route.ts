import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth";
import { ErrorSchema } from "../schemas/errors.schema";
import { WorkoutPlanSchema } from "../schemas/workout-plan.schema";
import { CreateWorkoutPlan } from "../use-cases/workout-plans/create-workout-plan";
import { NotFoundError } from "../util/errors";

export default async function WorkoutPlansRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: "/",
        schema: {
            body: WorkoutPlanSchema.omit({ id: true }),
            response: {
                201: WorkoutPlanSchema,
                400: ErrorSchema,
                401: ErrorSchema,
                500: ErrorSchema,
                404: ErrorSchema,
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

                const createWorkoutPlan = new CreateWorkoutPlan();
                const result = await createWorkoutPlan.execute({
                    userId: session.user.id,
                    name: req.body.name,
                    workoutDays: req.body.workoutDays,
                });
                return res.status(201).send(result);
            } catch (error) {
                app.log.error(error);

                if (error instanceof NotFoundError) {
                    return res
                        .status(404)
                        .send({ error: error.message, code: "NOT_FOUND" });
                }

                return res.status(500).send({
                    error: "Internal Server Error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });
}
