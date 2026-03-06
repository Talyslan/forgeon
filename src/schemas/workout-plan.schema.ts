import z from "zod";

import { WeekDay } from "../generated/prisma/enums";

export const WorkoutPlanSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1),
    workoutDays: z.array(
        z.object({
            name: z.string().trim().min(1),
            weekDay: z.enum(WeekDay),
            isRest: z.boolean().default(false),
            estimatedDurationInSeconds: z.number().min(1),
            coverImageUrl: z.url().optional(),
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
});

const WorkoutDaySummarySchema = z.object({
    id: z.uuid(),
    weekDay: z.enum(WeekDay),
    name: z.string().trim().min(1),
    isRest: z.boolean(),
    coverImageUrl: z.url().optional(),
    estimatedDurationInSeconds: z.number().min(1),
    exercisesCount: z.number(),
});

export const GetWorkoutPlanResponseSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1),
    workoutDays: z.array(WorkoutDaySummarySchema),
});

const WorkoutExerciseSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1),
    order: z.number().min(0),
    workoutDayId: z.uuid(),
    sets: z.number().min(1),
    reps: z.number().min(1),
    restTimeInSeconds: z.number().min(1),
});

const WorkoutSessionSummarySchema = z.object({
    id: z.uuid(),
    workoutDayId: z.uuid(),
    startedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().optional(),
});

export const GetWorkoutDayResponseSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1),
    isRest: z.boolean(),
    coverImageUrl: z.url().optional(),
    estimatedDurationInSeconds: z.number().min(1),
    weekDay: z.enum(WeekDay),
    exercises: z.array(WorkoutExerciseSchema),
    sessions: z.array(WorkoutSessionSummarySchema),
});
