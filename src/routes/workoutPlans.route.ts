import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { WeekDay } from "../generated/prisma/enums";
import { auth } from "../lib/auth";
import { CreateWorkoutPlan } from "../use-cases/workout-plans/create-workout-plan";
import { NotFoundError } from "../util/errors";

export default async function WorkoutPlansRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: "/workout-plans",
        schema: {
            body: z.object({
                name: z.string().trim().min(1),
                workoutDays: z.array(
                    z.object({
                        name: z.string().trim().min(1),
                        weekDay: z.enum(WeekDay),
                        isRest: z.boolean().default(false),
                        estimatedDurationInSeconds: z.number().min(1),
                        exercises: z.array(
                            z.object({
                                order: z.number().min(0),
                                name: z.string().trim().min(1),
                                sets: z.number().min(1),
                                reps: z.number().min(1),
                                restTimeInSeconds: z.number().min(1),
                            }),
                        ),
                    }),
                ),
            }),
            response: {
                201: z.object({
                    id: z.uuid(),
                    name: z.string().trim().min(1),
                    workoutDays: z.array(
                        z.object({
                            name: z.string().trim().min(1),
                            weekDay: z.enum(WeekDay),
                            isRest: z.boolean().default(false),
                            estimatedDurationInSeconds: z.number().min(1),
                            exercises: z.array(
                                z.object({
                                    order: z.number().min(0),
                                    name: z.string().trim().min(1),
                                    sets: z.number().min(1),
                                    reps: z.number().min(1),
                                    restTimeInSeconds: z.number().min(1),
                                }),
                            ),
                        }),
                    ),
                }),
                400: z.object({
                    error: z.string(),
                    code: z.string(),
                }),
                401: z.object({
                    error: z.string(),
                    code: z.string(),
                }),
                500: z.object({
                    error: z.string(),
                    code: z.string(),
                }),
                404: z.object({
                    error: z.string(),
                    code: z.string(),
                })
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

                return res
                    .status(500)
                    .send({
                        error: "Internal Server Error",
                        code: "INTERNAL_SERVER_ERROR",
                    });
            }
        },
    });
}
