import { prisma } from "../../lib/database";

interface OutputDto {
    userId: string;
    userName: string;
    weightInGrams: number;
    heightInCentimeters: number;
    age: number;
    bodyFatPercentage: number; // 1 representa 100%
}

export class GetUserTrainData {
    public async execute(userId: string): Promise<OutputDto | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            bodyFatPercentage: user.bodyFatPercentage! / 100, // Converte 100 para 1 (100%)
        };
    }
}
