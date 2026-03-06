import { prisma } from "../../lib/database";

interface InputDto {
    userId: string;
    weightInGrams: number;
    heightInCentimeters: number;
    age: number;
    bodyFatPercentage: number; // 1 representa 100%
}

interface OutputDto {
    userId: string;
    weightInGrams: number;
    heightInCentimeters: number;
    age: number;
    bodyFatPercentage: number;
}

export class UpsertUserTrainData {
    public async execute(dto: InputDto): Promise<OutputDto> {
        const user = await prisma.user.update({
            where: { id: dto.userId },
            data: {
                weightInGrams: dto.weightInGrams,
                heightInCentimeters: dto.heightInCentimeters,
                age: dto.age,
                bodyFatPercentage: Math.round(dto.bodyFatPercentage * 100), // Converte 1 (100%) para 100
            },
        });

        return {
            userId: user.id,
            weightInGrams: user.weightInGrams!,
            heightInCentimeters: user.heightInCentimeters!,
            age: user.age!,
            bodyFatPercentage: user.bodyFatPercentage! / 100, // Converte 100 para 1 (100%)
        };
    }
}
