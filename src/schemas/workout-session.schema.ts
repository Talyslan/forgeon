import z from "zod";

export const WorkoutSessionSchema = z.object({
    userWorkoutSessionId: z.uuid(),
});

