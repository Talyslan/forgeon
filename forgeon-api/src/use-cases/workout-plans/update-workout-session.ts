import { prisma } from "../../lib/database.js";
import { ForbiddenError, NotFoundError } from "../../util/errors.js";

interface InputDTO {
    userId: string;
    workoutPlanId: string;
    workoutDayId: string;
    sessionId: string;
    completedAt: Date;
}

interface OutputDTO {
    id: string;
    completedAt: string;
    startedAt: string;
}

export class UpdateWorkoutSession {
    public async execute(dto: InputDTO): Promise<OutputDTO> {
        const workoutPlan = await prisma.workoutPlan.findUnique({
            where: { id: dto.workoutPlanId },
            include: {
                workoutDays: {
                    where: { id: dto.workoutDayId },
                    include: {
                        sessions: {
                            where: { id: dto.sessionId },
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
                "You are not allowed to update a session for this workout plan",
            );
        }

        const [workoutDay] = workoutPlan.workoutDays;
        if (!workoutDay) {
            throw new NotFoundError("Workout day not found");
        }

        const [session] = workoutDay.sessions;
        if (!session) {
            throw new NotFoundError("Workout session not found");
        }

        const updated = await prisma.workoutSession.update({
            where: { id: dto.sessionId },
            data: { completedAt: dto.completedAt },
        });

        return {
            id: updated.id,
            completedAt: updated.completedAt!.toISOString(),
            startedAt: updated.startedAt.toISOString(),
        };
    }
}
