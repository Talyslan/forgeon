import z from "zod";

import { WeekDay } from "../generated/prisma/enums";

export const GetHomeParamsSchema = z.object({
    date: z.iso.date(), // YYYY-MM-DD
});

const TodayWorkoutDaySchema = z.object({
    workoutPlanId: z.string(),
    id: z.string(),
    name: z.string(),
    isRest: z.boolean(),
    weekDay: z.enum(WeekDay),
    estimatedDurationInSeconds: z.number(),
    coverImageUrl: z.url().optional(),
    exercisesCount: z.number(),
});

const ConsistencyDaySchema = z.object({
    workoutDayCompleted: z.boolean(),
    workoutDayStarted: z.boolean(),
});

export const GetHomeResponseSchema = z.object({
    activeWorkoutPlanId: z.string(),
    todayWorkoutDay: TodayWorkoutDaySchema.nullable(),
    workoutStreak: z.number(),
    consistencyByDay: z.record(z.string(), ConsistencyDaySchema),
});
