import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import type { WeekDay } from "../../generated/prisma/enums";
import { prisma } from "../../lib/database.js";

dayjs.extend(utc);

const WEEKDAY_BY_JS_DAY: WeekDay[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
];

interface InputDTO {
    userId: string;
    date: string; // YYYY-MM-DD
}

interface TodayWorkoutDayDTO {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: WeekDay;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercisesCount: number;
}

interface OutputDTO {
    activeWorkoutPlanId: string;
    todayWorkoutDay: TodayWorkoutDayDTO | null;
    workoutStreak: number;
    consistencyByDay: Record<
        string,
        { workoutDayCompleted: boolean; workoutDayStarted: boolean }
    >;
}

export class GetHomeData {
    public async execute(dto: InputDTO): Promise<OutputDTO> {
        const date = dayjs.utc(dto.date, "YYYY-MM-DD", true);
        if (!date.isValid()) {
            return this.emptyResponse(dto.date);
        }

        const weekStart = date.startOf("week").utc(); // Sunday 00:00:00
        const weekEnd = date.endOf("week").utc(); // Saturday 23:59:59.999

        const activePlan = await prisma.workoutPlan.findFirst({
            where: { userId: dto.userId, isActive: true },
            include: {
                workoutDays: {
                    include: {
                        _count: { select: { exercises: true } },
                    },
                },
            },
        });

        let activeWorkoutPlanId = "";
        let todayWorkoutDay: TodayWorkoutDayDTO | null = null;

        if (activePlan) {
            activeWorkoutPlanId = activePlan.id;
            const weekDayForDate = WEEKDAY_BY_JS_DAY[date.day()];
            const dayInPlan = activePlan.workoutDays.find(
                (d) => d.weekDay === weekDayForDate,
            );
            if (dayInPlan) {
                todayWorkoutDay = {
                    workoutPlanId: activePlan.id,
                    id: dayInPlan.id,
                    name: dayInPlan.name,
                    isRest: dayInPlan.isRest,
                    weekDay: dayInPlan.weekDay,
                    estimatedDurationInSeconds:
                        dayInPlan.estimatedDurationInSeconds,
                    coverImageUrl:
                        dayInPlan.coverImageUrl &&
                        dayInPlan.coverImageUrl.trim() !== ""
                            ? dayInPlan.coverImageUrl
                            : undefined,
                    exercisesCount: dayInPlan._count.exercises,
                };
            }
        }

        const sessionsInWeek = await prisma.workoutSession.findMany({
            where: {
                startedAt: {
                    gte: weekStart.toDate(),
                    lte: weekEnd.toDate(),
                },
                workoutDay: {
                    workoutPlan: { userId: dto.userId },
                },
            },
            select: {
                startedAt: true,
                completedAt: true,
            },
        });

        const consistencyByDay = this.buildConsistencyByDay(
            weekStart,
            weekEnd,
            sessionsInWeek,
        );

        const workoutStreak = activePlan
            ? await this.computeWorkoutStreak(
                  dto.userId,
                  dto.date,
                  activePlan.workoutDays.map((d) => d.weekDay),
              )
            : 0;

        return {
            activeWorkoutPlanId,
            todayWorkoutDay,
            workoutStreak,
            consistencyByDay,
        };
    }

    private emptyResponse(dateStr: string): OutputDTO {
        const date = dayjs.utc(dateStr, "YYYY-MM-DD", true);
        if (!date.isValid()) {
            return {
                activeWorkoutPlanId: "",
                todayWorkoutDay: null,
                workoutStreak: 0,
                consistencyByDay: {},
            };
        }
        const weekStart = date.startOf("week").utc();
        const weekEnd = date.endOf("week").utc();
        const consistencyByDay = this.buildConsistencyByDay(
            weekStart,
            weekEnd,
            [],
        );
        return {
            activeWorkoutPlanId: "",
            todayWorkoutDay: null,
            workoutStreak: 0,
            consistencyByDay,
        };
    }

    private buildConsistencyByDay(
        weekStart: dayjs.Dayjs,
        weekEnd: dayjs.Dayjs,
        sessions: Array<{ startedAt: Date; completedAt: Date | null }>,
    ): Record<
        string,
        { workoutDayCompleted: boolean; workoutDayStarted: boolean }
    > {
        const byDate = new Map<
            string,
            { started: boolean; completed: boolean }
        >();

        let d = weekStart;
        while (d.isBefore(weekEnd) || d.isSame(weekEnd, "day")) {
            byDate.set(d.format("YYYY-MM-DD"), {
                started: false,
                completed: false,
            });
            d = d.add(1, "day");
        }

        for (const s of sessions) {
            const key = dayjs.utc(s.startedAt).format("YYYY-MM-DD");
            const cur = byDate.get(key);
            if (cur) {
                cur.started = true;
                if (s.completedAt != null) cur.completed = true;
            }
        }

        const result: Record<
            string,
            { workoutDayCompleted: boolean; workoutDayStarted: boolean }
        > = {};
        byDate.forEach((v, k) => {
            result[k] = {
                workoutDayStarted: v.started,
                workoutDayCompleted: v.completed,
            };
        });
        return result;
    }

    private async computeWorkoutStreak(
        userId: string,
        fromDateStr: string,
        planWeekDays: WeekDay[],
    ): Promise<number> {
        if (planWeekDays.length === 0) return 0;

        let streak = 0;
        let d = dayjs.utc(fromDateStr, "YYYY-MM-DD");

        const completedDates = await prisma.workoutSession.findMany({
            where: {
                completedAt: { not: null },
                workoutDay: {
                    workoutPlan: { userId, isActive: true },
                },
            },
            select: { startedAt: true },
        });

        const completedSet = new Set(
            completedDates.map((s) =>
                dayjs.utc(s.startedAt).format("YYYY-MM-DD"),
            ),
        );

        while (true) {
            const weekDay = WEEKDAY_BY_JS_DAY[d.day()];
            if (!planWeekDays.includes(weekDay)) {
                d = d.subtract(1, "day");
                continue;
            }
            const key = d.format("YYYY-MM-DD");
            if (!completedSet.has(key)) break;
            streak += 1;
            d = d.subtract(1, "day");
        }

        return streak;
    }
}
