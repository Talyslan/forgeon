import { prisma } from "../../lib/database";

interface InputDto {
    userId: string;
}

interface OutputDto {
    userId: string;
    userName: string;
    weightInGrams: number;
    heightInCentimeters: number;
    age: number;
    bodyFatPercentage: number;
}

export class GetUserTrainData {
    public async execute(dto: InputDto): Promise<OutputDto | null> {
        const user = await prisma.user.findUnique({
            where: { id: dto.userId },
            select: {
                id: true,
                name: true,
                weightInGrams: true,
                heightInCentimeters: true,
                age: true,
                bodyFatPercentage: true,
            },
        });

        if (!user || user.weightInGrams === null) {
            return null;
        }

        return {
            userId: user.id,
            userName: user.name,
            weightInGrams: user.weightInGrams,
            heightInCentimeters: user.heightInCentimeters!,
            age: user.age!,
            bodyFatPercentage: user.bodyFatPercentage!,
        };
    }
}
