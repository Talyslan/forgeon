import z from "zod";

export const WorkoutSessionSchema = z.object({
    userWorkoutSessionId: z.uuid(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
    completedAt: z.iso.datetime(),
});

export const UpdateWorkoutSessionResponseSchema = z.object({
    id: z.uuid(),
    completedAt: z.iso.datetime(),
    startedAt: z.iso.datetime(),
});

