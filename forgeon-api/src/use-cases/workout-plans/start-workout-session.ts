import { prisma } from "../../lib/database.js";
import {
    ForbiddenError,
    NotFoundError,
    WorkoutPlanNotActiveError,
    WorkoutSessionAlreadyStartedError,
} from "../../util/errors.js";

interface InputDTO {
    userId: string;
    workoutPlanId: string;
    workoutDayId: string;
}

interface OutputDTO {
    userWorkoutSessionId: string;
}

export class StartWorkoutSession {
    public async execute(dto: InputDTO): Promise<OutputDTO> {
        const workoutPlan = await prisma.workoutPlan.findUnique({
            where: {
                id: dto.workoutPlanId,
            },
            include: {
                workoutDays: {
                    where: {
                        id: dto.workoutDayId,
                    },
                    include: {
                        sessions: {
                            where: {
                                completedAt: null,
                            },
                        },
                    },
                },
            },
        });

        if (!workoutPlan) {
            throw new NotFoundError("Workout plan not found");
        }

        if (workoutPlan.userId !== dto.userId) {
            throw new ForbiddenError(
                "You are not allowed to start a session for this workout plan",
            );
        }

        if (!workoutPlan.isActive) {
            throw new WorkoutPlanNotActiveError("Workout plan is not active");
        }

        const [workoutDay] = workoutPlan.workoutDays;

        if (!workoutDay) {
            throw new NotFoundError("Workout day not found");
        }

        if (workoutDay.sessions.length > 0) {
            throw new WorkoutSessionAlreadyStartedError(
                "Workout session already started for this day",
            );
        }

        const workoutSession = await prisma.workoutSession.create({
            data: {
                workoutDayId: workoutDay.id,
                startedAt: new Date(),
            },
        });

        return {
            userWorkoutSessionId: workoutSession.id,
        };
    }
}
