import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { auth } from "../lib/auth";
import { ErrorSchema } from "../schemas/errors.schema";
import {
    GetWorkoutPlanResponseSchema,
    WorkoutPlanSchema,
} from "../schemas/workout-plan.schema";
import {
    UpdateWorkoutSessionBodySchema,
    UpdateWorkoutSessionResponseSchema,
    WorkoutSessionSchema,
} from "../schemas/workout-session.schema";
import { CreateWorkoutPlan } from "../use-cases/workout-plans/create-workout-plan";
import { GetWorkoutPlan } from "../use-cases/workout-plans/get-workout-plan";
import { StartWorkoutSession } from "../use-cases/workout-plans/start-workout-session";
import { UpdateWorkoutSession } from "../use-cases/workout-plans/update-workout-session";
import {
    ForbiddenError,
    NotFoundError,
    WorkoutPlanNotActiveError,
    WorkoutSessionAlreadyStartedError,
} from "../util/errors";

export default async function WorkoutPlansRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: "/",
        schema: {
            tags: ["Workout Plan"],
            summary: "Create a workout plan",
            body: WorkoutPlanSchema.omit({ id: true }),
            response: {
                201: WorkoutPlanSchema,
                400: ErrorSchema,
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

    app.withTypeProvider<ZodTypeProvider>().route({
        method: "GET",
        url: "/:id",
        schema: {
            tags: ["Workout Plan"],
            summary: "Get workout plan by id",
            params: z.object({ id: z.uuid() }),
            response: {
                200: GetWorkoutPlanResponseSchema,
                401: ErrorSchema,
                403: ErrorSchema,
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

                const getWorkoutPlan = new GetWorkoutPlan();
                const result = await getWorkoutPlan.execute({
                    userId: session.user.id,
                    workoutPlanId: req.params.id,
                });

                return res.status(200).send(result);
            } catch (error) {
                app.log.error(error);

                if (error instanceof NotFoundError) {
                    return res
                        .status(404)
                        .send({ error: error.message, code: "NOT_FOUND" });
                }

                if (error instanceof ForbiddenError) {
                    return res.status(403).send({
                        error: error.message,
                        code: "FORBIDDEN",
                    });
                }

                return res.status(500).send({
                    error: "Internal Server Error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });

    app.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: "/:workoutPlanId/days/:workoutDayId/sessions",
        schema: {
            tags: ["Workout Plan"],
            summary: "Start a workout session",
            params: z.object({
                workoutPlanId: z.uuid(),
                workoutDayId: z.uuid(),
            }),
            response: {
                201: WorkoutSessionSchema,
                400: ErrorSchema,
                401: ErrorSchema,
                403: ErrorSchema,
                404: ErrorSchema,
                409: ErrorSchema,
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

                const startWorkoutSession = new StartWorkoutSession();
                const result = await startWorkoutSession.execute({
                    userId: session.user.id,
                    workoutPlanId: req.params.workoutPlanId,
                    workoutDayId: req.params.workoutDayId,
                });

                return res.status(201).send(result);
            } catch (error) {
                app.log.error(error);

                if (error instanceof NotFoundError) {
                    return res
                        .status(404)
                        .send({ error: error.message, code: "NOT_FOUND" });
                }

                if (error instanceof WorkoutPlanNotActiveError) {
                    return res.status(400).send({
                        error: error.message,
                        code: "WORKOUT_PLAN_NOT_ACTIVE",
                    });
                }

                if (error instanceof ForbiddenError) {
                    return res.status(403).send({
                        error: error.message,
                        code: "FORBIDDEN",
                    });
                }

                if (error instanceof WorkoutSessionAlreadyStartedError) {
                    return res.status(409).send({
                        error: error.message,
                        code: "WORKOUT_SESSION_ALREADY_STARTED",
                    });
                }

                return res.status(500).send({
                    error: "Internal Server Error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });

    app.withTypeProvider<ZodTypeProvider>().route({
        method: "PATCH",
        url: "/:workoutPlanId/days/:workoutDayId/sessions/:sessionId",
        schema: {
            tags: ["Workout Plan"],
            summary: "Update a workout session",
            params: z.object({
                workoutPlanId: z.uuid(),
                workoutDayId: z.uuid(),
                sessionId: z.uuid(),
            }),
            body: UpdateWorkoutSessionBodySchema,
            response: {
                200: UpdateWorkoutSessionResponseSchema,
                401: ErrorSchema,
                403: ErrorSchema,
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

                const updateWorkoutSession = new UpdateWorkoutSession();
                const result = await updateWorkoutSession.execute({
                    userId: session.user.id,
                    workoutPlanId: req.params.workoutPlanId,
                    workoutDayId: req.params.workoutDayId,
                    sessionId: req.params.sessionId,
                    completedAt: new Date(req.body.completedAt),
                });

                return res.status(200).send(result);
            } catch (error) {
                app.log.error(error);

                if (error instanceof NotFoundError) {
                    return res
                        .status(404)
                        .send({ error: error.message, code: "NOT_FOUND" });
                }

                if (error instanceof ForbiddenError) {
                    return res.status(403).send({
                        error: error.message,
                        code: "FORBIDDEN",
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
