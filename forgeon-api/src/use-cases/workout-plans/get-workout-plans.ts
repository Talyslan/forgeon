import type { WeekDay } from "../../generated/prisma/enums";
import { prisma } from "../../lib/database.js";

interface InputDto {
    userId: string;
    active?: boolean;
}

interface ExerciseDto {
    id: string;
    name: string;
    order: number;
    workoutDayId: string;
    sets: number;
    reps: number;
    restTimeInSeconds: number;
}

interface WorkoutDayDto {
    id: string;
    name: string;
    isRest: boolean;
    coverImageUrl?: string;
    estimatedDurationInSeconds: number;
    weekDay: WeekDay;
    exercises: ExerciseDto[];
}

interface OutputDtoItem {
    id: string;
    name: string;
    isActive: boolean;
    workoutDays: WorkoutDayDto[];
}

type OutputDto = OutputDtoItem[];

export class GetWorkoutPlans {
    async execute(dto: InputDto): Promise<OutputDto> {
        const whereClause: { userId: string; isActive?: boolean } = {
            userId: dto.userId,
        };

        if (dto.active !== undefined) {
            whereClause.isActive = dto.active;
        }

        const plans = await prisma.workoutPlan.findMany({
            where: whereClause,
            include: {
                workoutDays: {
                    include: {
                        exercises: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            isActive: plan.isActive,
            workoutDays: plan.workoutDays.map((day) => ({
                id: day.id,
                name: day.name,
                isRest: day.isRest,
                coverImageUrl: day.coverImageUrl ?? undefined,
                estimatedDurationInSeconds: day.estimatedDurationInSeconds,
                weekDay: day.weekDay,
                exercises: day.exercises.map((ex) => ({
                    id: ex.id,
                    name: ex.name,
                    order: ex.order,
                    workoutDayId: ex.workoutDayId,
                    sets: ex.sets,
                    reps: ex.reps,
                    restTimeInSeconds: ex.restTimeInSeconds,
                })),
            })),
        }));
    }
}
