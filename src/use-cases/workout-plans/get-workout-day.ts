import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import type { WeekDay } from "../../generated/prisma/enums";
import { prisma } from "../../lib/database";
import { ForbiddenError, NotFoundError } from "../../util/errors";

dayjs.extend(utc);

interface ExerciseDTO {
    id: string;
    name: string;
    order: number;
    workoutDayId: string;
    sets: number;
    reps: number;
    restTimeInSeconds: number;
}

interface SessionDTO {
    id: string;
    workoutDayId: string;
    startedAt: string;
    completedAt?: string;
}

interface OutputDTO {
    id: string;
    name: string;
    isRest: boolean;
    coverImageUrl?: string;
    estimatedDurationInSeconds: number;
    weekDay: WeekDay;
    exercises: ExerciseDTO[];
    sessions: SessionDTO[];
}

interface InputDTO {
    userId: string;
    workoutPlanId: string;
    workoutDayId: string;
}

export class GetWorkoutDay {
    public async execute(dto: InputDTO): Promise<OutputDTO> {
        const plan = await prisma.workoutPlan.findUnique({
            where: { id: dto.workoutPlanId },
            include: {
                workoutDays: {
                    where: { id: dto.workoutDayId },
                    include: {
                        exercises: true,
                        sessions: true,
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

        const [day] = plan.workoutDays;
        if (!day) {
            throw new NotFoundError("Workout day not found");
        }

        return {
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
            sessions: day.sessions.map((s) => ({
                id: s.id,
                workoutDayId: s.workoutDayId,
                startedAt: dayjs.utc(s.startedAt).format("YYYY-MM-DD"),
                completedAt: s.completedAt
                    ? dayjs.utc(s.completedAt).format("YYYY-MM-DD")
                    : undefined,
            })),
        };
    }
}
