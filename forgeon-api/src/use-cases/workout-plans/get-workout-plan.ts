import type { WeekDay } from "../../generated/prisma/enums";
import { prisma } from "../../lib/database.js";
import { ForbiddenError, NotFoundError } from "../../util/errors.js";

interface InputDTO {
    userId: string;
    workoutPlanId: string;
}

interface WorkoutDayDTO {
    id: string;
    weekDay: WeekDay;
    name: string;
    isRest: boolean;
    coverImageUrl?: string;
    estimatedDurationInSeconds: number;
    exercisesCount: number;
}

interface OutputDTO {
    id: string;
    name: string;
    workoutDays: WorkoutDayDTO[];
}

export class GetWorkoutPlan {
    public async execute(dto: InputDTO): Promise<OutputDTO> {
        const plan = await prisma.workoutPlan.findUnique({
            where: { id: dto.workoutPlanId },
            include: {
                workoutDays: {
                    include: {
                        _count: { select: { exercises: true } },
                    },
                },
            },
        });

        if (!plan) {
            throw new NotFoundError("Workout plan not found");
        }

        if (plan.userId !== dto.userId) {
            throw new ForbiddenError(
                "You are not allowed to access this workout plan",
            );
        }

        const result = {
            id: plan.id,
            name: plan.name,
            workoutDays: plan.workoutDays.map((day) => ({
                id: day.id,
                weekDay: day.weekDay,
                name: day.name,
                isRest: day.isRest,
                coverImageUrl:
                    day.coverImageUrl && day.coverImageUrl.trim() !== ""
                        ? day.coverImageUrl
                        : undefined,
                estimatedDurationInSeconds: day.estimatedDurationInSeconds,
                exercisesCount: day._count.exercises,
            })),
        };
        return result;
    }
}
